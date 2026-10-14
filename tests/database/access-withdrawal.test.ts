import { assertAccessInspectionSnapshot, assertAccessInspectionSeedLedger } from "../helpers/access-inspection-upgrade";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import {
  accessRequest,
  accessRequests,
  accessRequestReceipt,
  submitAccessRequest,
  decideAccessRequest,
  applyAccessRequest,
  withdrawAccessRequest,
} from "../../src/access/requests";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const ws = "10000000-0000-4000-8000-000000000001",
  company = "20000000-0000-4000-8000-000000000002";
const rows = async (sql: string, params: unknown[] = []) =>
  (await database().query(sql, params)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const command = (extra: Record<string, unknown> = {}) => ({
  schema_version: 1,
  operation_id: randomUUID(),
  expected_version: 2,
  reason: "Close this obsolete synthetic request without changing access.",
  ...extra,
});
let requester: Principal, reviewer: Principal, subject: Principal;
let n = 0;
const caps = [
  "pack.prepare",
  "pack.check",
  "pack.issue",
  "report.review",
  "report.issue",
  "report.respond",
  "activity.edit",
  "estimating.edit",
  "estimating.quote.prepare",
  "finance.prepare",
  "finance.review",
  "finance.process",
  "finance.reconcile",
  "finance.issue",
  "crm.opportunity.edit",
  "project.create",
  "project.edit",
  "engineering.create",
  "engineering.edit",
  "products.edit",
  "products.review",
  "products.publish",
  "supply.coordinate",
  "supply.inspect",
  "warranty.manage",
  "maintenance.manage",
];
async function proposal(
  state = "Approved",
  extra: Record<string, unknown> = {},
) {
  const input = {
    schema_version: 1,
    operation_id: randomUUID(),
    request_id: randomUUID(),
    subject_id: subject.actor_id,
    reviewer_id: reviewer.actor_id,
    capability: caps[n++],
    scope_type: "Company",
    company_id: company,
    site_id: null,
    valid_from: "2035-01-01T00:00:00.123Z",
    valid_to: "2035-02-01T00:00:00.456Z",
    reason: "Exact synthetic proposal retained through withdrawal.",
    ...extra,
  };
  const submitted = await submitAccessRequest(requester, input);
  const decided =
    state !== "Submitted"
      ? await decideAccessRequest(
          reviewer,
          input.request_id,
          command({
            expected_version: 1,
            decision: state === "Applied" ? "Approved" : state,
          }),
        )
      : null;
  const applied =
    state === "Applied"
      ? await applyAccessRequest(requester, input.request_id, command())
      : null;
  return { id: input.request_id, input, submitted, decided, applied };
}
const snapshot = async () =>
  Promise.all(
    [
      "users",
      "permission_grants",
      "access_change_operations",
      "audit_events",
    ].map((t) => rows(`SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY id`)),
  );

// Populated 0080 setup, two full seed replays and exact historical snapshots share this fixture budget.
test(
  "AD01 withdrawal: populated 0080 upgrade retains exact requests, grants, histories, receipts and ledgers",
  { timeout: 300000 },
  async () => {
    await transaction(async (c) => {
      await c.query("SET LOCAL statement_timeout='120s'");
      await c.query(
        await readFile(
          new URL("../../db/migrations/0001-recover.sql", import.meta.url),
          "utf8",
        ),
      );
      await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
    });
    await migrate(80);
    await seed(80);
    requester = (await createSession("systems")).principal;
    reviewer = (await createSession("scheduling-policy-reviewer")).principal;
    subject = (await createSession("site-observer")).principal;
    const fixtures = [];
    for (const state of ["Submitted", "Approved", "Returned", "Applied"])
      fixtures.push(await proposal(state));
    const original = await snapshot(),
      originalRequests = await rows(
        "SELECT to_jsonb(r) value FROM ppo.access_change_requests r ORDER BY id",
      ),
      ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      seeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
    await migrate();
    await seed();
    assertAccessInspectionSnapshot(await snapshot(), original, ["users","permission_grants","access_change_operations","audit_events"]);
    assert.deepEqual(
      await rows(
        "SELECT to_jsonb(r)-ARRAY['withdrawn_at','withdrawal_reason'] value FROM ppo.access_change_requests r ORDER BY id",
      ),
      originalRequests,
    );
    const next = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    );
    assert.deepEqual(
      next.filter((r) => r.version <= 80),
      ledger,
    );
    assert.deepEqual(
      next.filter((r) => r.version > 80).map((r) => r.version),
      [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96],
    );
    assertAccessInspectionSeedLedger(seeds, await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"));
    for (const f of fixtures) {
      assert.deepEqual(
        await accessRequestReceipt(requester, f.submitted.receipt.operation_id),
        f.submitted.receipt,
      );
      if (f.decided)
        assert.deepEqual(
          await accessRequestReceipt(reviewer, f.decided.receipt.operation_id),
          f.decided.receipt,
        );
      if (f.applied)
        assert.deepEqual(
          await accessRequestReceipt(requester, f.applied.receipt.operation_id),
          f.applied.receipt,
        );
    }
    await migrate();
    await seed();
    assertAccessInspectionSnapshot(await snapshot(), original, ["users","permission_grants","access_change_operations","audit_events"]);
    assert.deepEqual(
      await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
      next,
    );
    assertAccessInspectionSeedLedger(seeds, await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"));
    for (const f of fixtures.slice(0, 2))
      await withdrawAccessRequest(
        requester,
        f.id,
        command({ expected_version: f.decided ? 2 : 1 }),
      );
  },
);

test("AD01 withdrawal: exact closure, authority, concurrency and original recovery", async (t) => {
  await t.test(
    "Submitted and Approved close once, retain exact originals, release the tuple and recover after replacement",
    async () => {
      for (const state of ["Submitted", "Approved"]) {
        const f = await proposal(state),
          before = await snapshot(),
          r = (await accessRequest(requester, f.id)).request,
          input = command({ expected_version: r.version });
        assert.equal((await accessRequest(requester, f.id)).can_withdraw, true);
        const results = await Promise.all([
          withdrawAccessRequest(requester, f.id, input),
          withdrawAccessRequest(requester, f.id, input),
        ]);
        assert.deepEqual(results[0].receipt, results[1].receipt);
        assert.deepEqual(results.map((x) => x.replayed).sort(), [false, true]);
        const d = await accessRequest(requester, f.id);
        assert.equal(d.request.state, "Withdrawn");
        assert.equal(d.request.version, r.version + 1);
        assert.equal(d.can_withdraw, false);
        assert.equal(d.can_apply, false);
        assert.equal(d.can_decide, false);
        const omit = (value: Record<string, unknown>) =>
          Object.fromEntries(
            Object.entries(value).filter(
              ([k]) =>
                ![
                  "state",
                  "version",
                  "withdrawn_at",
                  "withdrawal_reason",
                ].includes(k),
            ),
          );
        assert.deepEqual(omit(d.request), omit(r));
        const after = await snapshot();
        assert.deepEqual(after.slice(0, 2), before.slice(0, 2));
        for (const i of [2, 3])
          assert.deepEqual(
            after[i].filter((x) =>
              before[i].some((y) => y.value.id === x.value.id),
            ),
            before[i],
          );
        assert.equal(after[2].length, before[2].length + 1);
        assert.equal(after[3].length, before[3].length + 1);
        assert.equal(d.history.at(-1)?.actor_id, requester.actor_id);
        assert.equal(d.history.at(-1)?.reason, input.reason);
        const replacement = {
          ...f.input,
          operation_id: randomUUID(),
          request_id: randomUUID(),
          valid_from: "2036-01-01T00:00:00Z",
          valid_to: null,
        };
        const fresh = await submitAccessRequest(requester, replacement);
        assert.equal(fresh.receipt.state, "Submitted");
        assert.equal(fresh.receipt.record_version, 1);
        assert.deepEqual(
          (await withdrawAccessRequest(requester, f.id, input)).receipt,
          results[0].receipt,
        );
        assert.deepEqual(
          await accessRequestReceipt(requester, input.operation_id),
          results[0].receipt,
        );
        await assert.rejects(
          withdrawAccessRequest(requester, f.id, {
            ...input,
            reason:
              "Different content must never reuse this original operation.",
          }),
          code("OperationConflict"),
        );
        await assert.rejects(
          accessRequestReceipt(reviewer, input.operation_id),
          code("NotFound"),
        );
        assert(
          (await accessRequests(requester, { state: "Withdrawn" })).items.some(
            (x) => x.id === f.id,
          ),
        );
      }
    },
  );
  await t.test(
    "only the original requester with current local Workspace duties may close or recover",
    async () => {
      const f = await proposal(),
        grant = randomUUID();
      await rows(
        "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'admin.access.propose','Workspace',$2)",
        [grant, ws, reviewer.actor_id],
      );
      try {
        assert.equal((await accessRequest(reviewer, f.id)).can_withdraw, false);
        await assert.rejects(
          withdrawAccessRequest(reviewer, f.id, command()),
          code("RequesterRequired"),
        );
      } finally {
        await rows("DELETE FROM ppo.permission_grants WHERE id=$1", [grant]);
      }
      await assert.rejects(
        withdrawAccessRequest(subject, f.id, command()),
        code("Forbidden"),
      );
      await assert.rejects(
        withdrawAccessRequest(
          { ...requester, workspace_id: randomUUID() },
          f.id,
          command(),
        ),
        code("Forbidden"),
      );
      const input = command(),
        accepted = await withdrawAccessRequest(requester, f.id, input);
      for (const duty of ["admin.access.read", "admin.access.propose"]) {
        const [g] = await rows(
          "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2",
          [requester.actor_id, duty],
        );
        await rows(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=$1",
          [g.id],
        );
        try {
          await assert.rejects(
            withdrawAccessRequest(requester, f.id, input),
            code("Forbidden"),
          );
          await assert.rejects(
            accessRequestReceipt(requester, input.operation_id),
            code("Forbidden"),
          );
        } finally {
          await rows(
            "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
            [g.id, g.valid_to],
          );
        }
      }
      await rows(
        "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
        [ws, requester.actor_id, company],
      );
      try {
        await assert.rejects(
          withdrawAccessRequest(requester, f.id, input),
          code("WorkingCompanySelected"),
        );
        await assert.rejects(
          accessRequestReceipt(requester, input.operation_id),
          code("WorkingCompanySelected"),
        );
      } finally {
        await rows("DELETE FROM ppo.working_companies WHERE user_id=$1", [
          requester.actor_id,
        ]);
      }
      const env = process.env.PPO_ENV;
      try {
        process.env.PPO_ENV = "azure-demo";
        await assert.rejects(
          withdrawAccessRequest(requester, f.id, input),
          code("LocalOnly"),
        );
      } finally {
        if (env === undefined) delete process.env.PPO_ENV;
        else process.env.PPO_ENV = env;
      }
      assert.deepEqual(
        await accessRequestReceipt(requester, input.operation_id),
        accepted.receipt,
      );
    },
  );
  await t.test(
    "late or no-longer-eligible proposals can close without changing installed access",
    async () => {
      const start = new Date(Date.now() + 1500).toISOString(),
        f = await proposal("Approved", { valid_from: start });
      await rows("UPDATE ppo.users SET active=false WHERE id=$1", [
        subject.actor_id,
      ]);
      const [g] = await rows(
        "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='admin.access.approve'",
        [reviewer.actor_id],
      );
      await rows(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=$1",
        [g.id],
      );
      try {
        await new Promise((r) => setTimeout(r, 1600));
        const before = await snapshot();
        assert.equal(
          (await withdrawAccessRequest(requester, f.id, command())).receipt
            .state,
          "Withdrawn",
        );
        assert.deepEqual((await snapshot()).slice(0, 2), before.slice(0, 2));
      } finally {
        await rows("UPDATE ppo.users SET active=true WHERE id=$1", [
          subject.actor_id,
        ]);
        await rows("UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1", [
          g.id,
          g.valid_to,
        ]);
      }
    },
  );
  await t.test(
    "terminal states, stale versions and malformed proposals have no effects",
    async () => {
      for (const state of ["Returned", "Applied"]) {
        const f = await proposal(state),
          before = await snapshot();
        await assert.rejects(
          withdrawAccessRequest(
            requester,
            f.id,
            command({ expected_version: state === "Applied" ? 3 : 2 }),
          ),
          code("VersionConflict"),
        );
        assert.deepEqual(await snapshot(), before);
      }
      const f = await proposal();
      for (const extra of [
        { expected_version: 1 },
        { reason: "short" },
        { reason: "x".repeat(1001) },
        { decision: "Returned" },
        { capability: "pack.issue" },
      ])
        await assert.rejects(
          withdrawAccessRequest(requester, f.id, command(extra)),
          code("expected_version" in extra ? "VersionConflict" : "InvalidData"),
        );
      await withdrawAccessRequest(requester, f.id, command());
      await assert.rejects(
        withdrawAccessRequest(
          requester,
          f.id,
          command({ expected_version: 3 }),
        ),
        code("VersionConflict"),
      );
    },
  );
  await t.test(
    "withdrawal races decision/application with exactly one transition",
    async () => {
      for (const state of ["Submitted", "Approved"]) {
        const f = await proposal(state),
          before = await rows(
            "SELECT * FROM ppo.permission_grants ORDER BY id",
          );
        const results = await Promise.allSettled([
          withdrawAccessRequest(
            requester,
            f.id,
            command({ expected_version: state === "Submitted" ? 1 : 2 }),
          ),
          state === "Submitted"
            ? decideAccessRequest(
                reviewer,
                f.id,
                command({ expected_version: 1, decision: "Approved" }),
              )
            : applyAccessRequest(requester, f.id, command()),
        ]);
        assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
        const rejected = results.find(
          (r) => r.status === "rejected",
        ) as PromiseRejectedResult;
        assert.equal(rejected.reason.code, "VersionConflict");
        const d = await accessRequest(requester, f.id);
        assert.equal(d.history.length, state === "Submitted" ? 2 : 3);
        const after = await rows(
          "SELECT * FROM ppo.permission_grants ORDER BY id",
        );
        if (d.request.state === "Applied") {
          assert.equal(after.length, before.length + 1);
          assert.deepEqual(
            after.filter((g) => g.id !== d.request.grant_id),
            before,
          );
        } else assert.deepEqual(after, before);
      }
    },
  );
  await t.test(
    "authority revocation while waiting for the lock refuses closure",
    async () => {
      const f = await proposal(),
        blocker = await database().connect();
      const [g] = await rows(
        "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='admin.access.propose'",
        [requester.actor_id],
      );
      try {
        await blocker.query("BEGIN");
        await blocker.query(
          "LOCK TABLE ppo.permission_grants IN SHARE ROW EXCLUSIVE MODE",
        );
        const pending = assert.rejects(
          withdrawAccessRequest(requester, f.id, command()),
          code("Forbidden"),
        );
        let waiting = false;
        for (let i = 0; i < 100; i++) {
          waiting =
            (
              await rows(
                "SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE 'LOCK TABLE ppo.users,%'",
              )
            ).length > 0;
          if (waiting) break;
          await new Promise((r) => setTimeout(r, 20));
        }
        assert(waiting, "withdrawal must be waiting for the authority lock");
        await blocker.query(
          "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=$1",
          [g.id],
        );
        await blocker.query("COMMIT");
        await pending;
      } finally {
        await blocker.query("ROLLBACK");
        blocker.release();
        await rows("UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1", [
          g.id,
          g.valid_to,
        ]);
      }
      assert.equal(
        (await accessRequest(requester, f.id)).request.state,
        "Approved",
      );
    },
  );
  await t.test(
    "late audit failure and missing evidence roll back, while accepted history is immutable",
    async () => {
      const f = await proposal(),
        before = await snapshot();
      await rows(
        "CREATE FUNCTION ppo.test_refuse_withdrawal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.details->>'state'='Withdrawn' THEN RAISE EXCEPTION 'Synthetic withdrawal audit failure'; END IF; RETURN NEW; END $$",
      );
      await rows(
        "CREATE TRIGGER test_refuse_withdrawal BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.test_refuse_withdrawal()",
      );
      try {
        await assert.rejects(
          withdrawAccessRequest(requester, f.id, command()),
          /Synthetic withdrawal audit failure/,
        );
      } finally {
        await rows("DROP TRIGGER test_refuse_withdrawal ON ppo.audit_events");
        await rows("DROP FUNCTION ppo.test_refuse_withdrawal()");
      }
      assert.deepEqual(await snapshot(), before);
      await assert.rejects(
        transaction(async (c) => {
          await c.query(
            "UPDATE ppo.access_change_requests SET state='Withdrawn',version=3,withdrawn_at=clock_timestamp(),withdrawal_reason='No exact audit or receipt accompanies this direct transition.' WHERE id=$1",
            [f.id],
          );
        }),
        code("23514"),
      );
      assert.equal(
        (await accessRequest(requester, f.id)).request.state,
        "Approved",
      );
      const result = await withdrawAccessRequest(requester, f.id, command());
      await assert.rejects(
        rows(
          "UPDATE ppo.access_change_requests SET withdrawal_reason='Attempt to rewrite the retained withdrawal reason.' WHERE id=$1",
          [f.id],
        ),
        code("55000"),
      );
      await assert.rejects(
        rows(
          "UPDATE ppo.access_change_operations SET command='Decide' WHERE id=$1",
          [result.receipt.receipt_id],
        ),
        code("55000"),
      );
      await assert.rejects(
        rows("DELETE FROM ppo.access_change_requests WHERE id=$1", [f.id]),
        code("55000"),
      );
    },
  );
});
