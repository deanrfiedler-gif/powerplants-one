import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { hasPermission } from "../../src/platform/permissions";
import {
  accessRequest,
  accessRequests,
  accessRequestReceipt,
  submitAccessRequest,
  decideAccessRequest,
  applyAccessRequest,
} from "../../src/access/requests";
import { accessApplicationSeedGrants, accessTeamSeedGrants, accessReviewSeedGrants, conversationSeedGrants, agentAskSeedGrants } from "../helpers/engineering-materials-grants";
import { recoverSchema } from "../helpers/recover-schema";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const ws = "10000000-0000-4000-8000-000000000001",
  company = "20000000-0000-4000-8000-000000000001",
  otherCompany = "20000000-0000-4000-8000-000000000002",
  site = "70000000-0000-4000-8000-000000000001";
const rows = async (sql: string, params: unknown[] = []) =>
  (await database().query(sql, params)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const command = (extra: Record<string, unknown> = {}) => ({
  schema_version: 1,
  operation_id: randomUUID(),
  expected_version: 2,
  reason: "Apply the independently approved synthetic grant exactly.",
  ...extra,
});
let executor: Principal, reviewer: Principal, subject: Principal;
let nextCapability = 0;
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
  extra: Record<string, unknown> = {},
  decision = "Approved",
) {
  const input = {
    ...command(),
    request_id: randomUUID(),
    subject_id: subject.actor_id,
    reviewer_id: reviewer.actor_id,
    capability: caps[nextCapability++],
    scope_type: "Company",
    company_id: company,
    site_id: null,
    valid_from: "2035-01-01T00:00:00.123Z",
    valid_to: "2035-02-01T00:00:00.456Z",
    ...extra,
  };
  const { expected_version: _version, ...submit } = input;
  void _version;
  const original = await submitAccessRequest(executor, submit);
  const decided = decision
    ? await decideAccessRequest(
        reviewer,
        input.request_id,
        command({ expected_version: 1, decision }),
      )
    : null;
  return { input, original, decided, id: input.request_id };
}
async function changeGrant(
  actor: Principal,
  duty: string,
  changes: string,
  work: () => Promise<void>,
) {
  const original = (
    await rows(
      "SELECT valid_from,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2",
      [actor.actor_id, duty],
    )
  )[0];
  await rows(
    `UPDATE ppo.permission_grants SET ${changes} WHERE user_id=$1 AND capability=$2`,
    [actor.actor_id, duty],
  );
  try {
    await work();
  } finally {
    await rows(
      "UPDATE ppo.permission_grants SET valid_from=$3,valid_to=$4 WHERE user_id=$1 AND capability=$2",
      [actor.actor_id, duty, original.valid_from, original.valid_to],
    );
  }
}
async function noApplication(id: string) {
  const detail = await accessRequest(executor, id);
  assert.equal(detail.request.state, "Approved");
  assert.equal(detail.request.version, 2);
  assert.equal(detail.request.grant_id, null);
  assert.equal(detail.history.length, 2);
  assert.equal(
    (
      await rows(
        "SELECT 1 FROM ppo.permission_grants g JOIN ppo.access_change_requests r ON (g.workspace_id,g.user_id,g.capability,g.scope_type,g.scope_id)=(r.workspace_id,r.subject_id,r.capability,r.scope_type,r.scope_id) WHERE r.id=$1",
        [id],
      )
    ).length,
    0,
  );
}

test("AD01 application: populated 0079 retains original proposals, decisions, audit and receipts; exact application/team duties and inert reseed", async () => {
  await transaction(async (c) => {
    await recoverSchema(c);
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate(79);
  await seed(79);
  executor = (await createSession("systems")).principal;
  reviewer = (await createSession("scheduling-policy-reviewer")).principal;
  subject = (await createSession("site-observer")).principal;
  const approved = await proposal(),
    returned = await proposal({}, "Returned"),
    submitted = await proposal({}, "");
  const snapshot = () =>
    Promise.all(
      ["access_change_operations", "audit_events", "users"].map((t) =>
        rows(`SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY id`),
      ),
    );
  const old = await snapshot(),
    requests = await rows(
      "SELECT to_jsonb(r) value FROM ppo.access_change_requests r ORDER BY id",
    ),
    grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    seeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), old);
  assert.deepEqual(
    await rows(
      "SELECT to_jsonb(r)-ARRAY['applied_by','applied_at','application_reason','grant_id','grant_snapshot','withdrawn_at','withdrawal_reason'] value FROM ppo.access_change_requests r ORDER BY id",
    ),
    requests,
  );
  const current = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    ids = new Set(grants.map((g) => g.id));
  assert.deepEqual(
    current.filter((g) => ids.has(g.id)),
    grants,
  );
  // Migration/seed numbering can move; the original grant identity stays fixed.
  assert.deepEqual(
    current.filter((g) => !ids.has(g.id) && g.capability !== "conversation.agent.ask"),
    [...conversationSeedGrants(grants), ...accessReviewSeedGrants(grants).map(g => ({ ...g, id: "ad010084-0000-4000-8000-000000000001" })), ...accessTeamSeedGrants(grants).map(g => ({ ...g, id: "ad010082-0000-4000-8000-000000000001" })), ...accessApplicationSeedGrants(grants).map((g) => ({
      ...g,
      id: "ad010080-0000-4000-8000-000000000001",
    }))].sort((a,b) => String(a.id).localeCompare(String(b.id))),
  );
  assert.deepEqual(current.filter(g => !ids.has(g.id) && g.capability === "conversation.agent.ask"),
    agentAskSeedGrants([...grants, ...conversationSeedGrants(grants)]).sort((a,b) => String(a.id).localeCompare(String(b.id))));
  const next = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    ),
    nextSeeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
  assert.deepEqual(
    next.filter((r) => r.version <= 79),
    ledger,
  );
  assert.deepEqual(
    next.filter((r) => r.version > 79).map((r) => r.version),
    [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 119],
  );
  assert.deepEqual(
    nextSeeds.filter((r) => r.version <= 79),
    seeds,
  );
  assert.deepEqual(
    nextSeeds.filter((r) => r.version > 79).map((r) => r.version),
    [80, 83, 84, 107, 108, 110],
  );
  for (const f of [approved, returned, submitted])
    assert.deepEqual(
      await accessRequestReceipt(executor, f.original.receipt.operation_id),
      f.original.receipt,
    );
  assert.deepEqual(
    await accessRequestReceipt(
      reviewer,
      approved.decided!.receipt.operation_id,
    ),
    approved.decided!.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), old);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    current,
  );
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    next,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
    nextSeeds,
  );
  await applyAccessRequest(executor, approved.id, command());
  assert.equal(
    (await accessRequest(executor, approved.id)).request.state,
    "Applied",
  );
});

test("AD01 application: exact grant, current duties, separation, concurrency and recovery", async (t) => {
  await t.test(
    "Company, Site and Workspace install exact future grants with linked original evidence",
    async () => {
      for (const scope of [
        {},
        { scope_type: "Site", site_id: site },
        { scope_type: "Workspace", company_id: null },
      ]) {
        const f = await proposal(scope),
          before = await rows(
            "SELECT to_jsonb(r) value FROM ppo.access_change_operations r WHERE request_id=$1 ORDER BY request_version",
            [f.id],
          );
        const input = command(),
          accepted = await applyAccessRequest(executor, f.id, input),
          d = await accessRequest(executor, f.id);
        assert.equal(accepted.receipt.state, "Applied");
        assert.equal(accepted.receipt.record_version, 3);
        assert.equal(d.can_apply, false);
        assert.equal(d.history.length, 3);
        const grant = (
          await rows(
            "SELECT to_jsonb(g) value FROM ppo.permission_grants g WHERE id=$1",
            [d.request.grant_id],
          )
        )[0].value;
        assert.deepEqual(grant, d.request.grant_snapshot);
        assert.equal(grant.user_id, subject.actor_id);
        assert.equal(grant.capability, f.input.capability);
        assert.equal(grant.scope_type, f.input.scope_type);
        assert.equal(
          new Date(grant.valid_from).toISOString(),
          f.input.valid_from,
        );
        assert.equal(new Date(grant.valid_to).toISOString(), f.input.valid_to);
        assert.equal(
          await hasPermission(
            database(),
            subject,
            f.input.capability as "pack.prepare",
            company,
            site,
          ),
          false,
        );
        assert.deepEqual(
          await rows(
            "SELECT to_jsonb(r) value FROM ppo.access_change_operations r WHERE request_id=$1 AND request_version<3 ORDER BY request_version",
            [f.id],
          ),
          before,
        );
        const replay = await applyAccessRequest(executor, f.id, input);
        assert.equal(replay.replayed, true);
        assert.deepEqual(replay.receipt, accepted.receipt);
        assert.deepEqual(
          await accessRequestReceipt(executor, input.operation_id),
          accepted.receipt,
        );
        await assert.rejects(
          applyAccessRequest(executor, f.id, {
            ...input,
            reason: "Changed application intent conflicts with the original.",
          }),
          code("OperationConflict"),
        );
        await assert.rejects(
          applyAccessRequest(executor, f.id, command()),
          code("VersionConflict"),
        );
        // Current state can change independently; recovery describes the exact original installation.
        await rows(
          "UPDATE ppo.permission_grants SET valid_from='2025-01-01',valid_to='2025-02-01' WHERE id=$1",
          [grant.id],
        );
        assert.deepEqual(
          (await applyAccessRequest(executor, f.id, input)).receipt,
          accepted.receipt,
        );
        assert.deepEqual(
          (await accessRequest(executor, f.id)).request.grant_snapshot,
          grant,
        );
      }
      assert(
        (await accessRequests(executor, { state: "Applied" })).items.length >=
          4,
      );
    },
  );
  await t.test(
    "read/propose/approve alone, hosted mode and other workspace cannot apply",
    async () => {
      const f = await proposal();
      await assert.rejects(
        applyAccessRequest(reviewer, f.id, command()),
        code("Forbidden"),
      );
      await assert.rejects(
        applyAccessRequest(subject, f.id, command()),
        code("Forbidden"),
      );
      await changeGrant(
        executor,
        "admin.access.apply",
        "valid_to='2026-01-02'",
        async () => {
          await assert.rejects(
            applyAccessRequest(executor, f.id, command()),
            code("Forbidden"),
          );
        },
      );
      await assert.rejects(
        applyAccessRequest(
          { ...executor, workspace_id: randomUUID() },
          f.id,
          command(),
        ),
        code("Forbidden"),
      );
      const env = process.env.PPO_ENV;
      try {
        process.env.PPO_ENV = "azure-demo";
        await assert.rejects(
          applyAccessRequest(executor, f.id, command()),
          code("LocalOnly"),
        );
      } finally {
        process.env.PPO_ENV = env;
      }
      await noApplication(f.id);
    },
  );
  await t.test(
    "reviewer and affected person cannot execute even with explicit read/apply duties",
    async () => {
      const f = await proposal(),
        ids: string[] = [];
      try {
        for (const p of [subject, reviewer])
          for (const duty of ["admin.access.read", "admin.access.apply"]) {
            const id = randomUUID();
            const r = await rows(
              "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,$4,'Workspace',$2,'2026-01-01') ON CONFLICT DO NOTHING RETURNING id",
              [id, ws, p.actor_id, duty],
            );
            if (r.length) ids.push(id);
          }
        for (const p of [subject, reviewer])
          await assert.rejects(
            applyAccessRequest(p, f.id, command()),
            code("IndependentExecutorRequired"),
          );
      } finally {
        await rows(
          "DELETE FROM ppo.permission_grants WHERE id=ANY($1::uuid[])",
          [ids],
        );
      }
      await noApplication(f.id);
    },
  );
  await t.test(
    "current requester/reviewer duty and active identities are revalidated",
    async () => {
      const f = await proposal();
      for (const [p, duty] of [
        [executor, "admin.access.propose"],
        [reviewer, "admin.access.approve"],
        [reviewer, "admin.access.read"],
      ] as const) {
        for (const change of [
          "valid_from='2040-01-01',valid_to=NULL",
          "valid_to='2026-01-02'",
        ])
          await changeGrant(p, duty, change, async () => {
            await assert.rejects(
              applyAccessRequest(executor, f.id, command()),
              code("AccessAuthorityChanged"),
            );
          });
      }
      for (const p of [executor, reviewer, subject]) {
        await rows("UPDATE ppo.users SET active=false WHERE id=$1", [
          p.actor_id,
        ]);
        try {
          await assert.rejects(
            applyAccessRequest(executor, f.id, command()),
            code(
              p === executor
                ? "Forbidden"
                : p === reviewer
                  ? "AccessAuthorityChanged"
                  : "InvalidData",
            ),
          );
        } finally {
          await rows("UPDATE ppo.users SET active=true WHERE id=$1", [
            p.actor_id,
          ]);
        }
      }
      await noApplication(f.id);
    },
  );
  await t.test(
    "working company and changed payload fields refuse application",
    async () => {
      const f = await proposal();
      await rows(
        "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
        [ws, executor.actor_id, company],
      );
      try {
        await assert.rejects(
          applyAccessRequest(executor, f.id, command()),
          code("WorkingCompanySelected"),
        );
      } finally {
        await rows("DELETE FROM ppo.working_companies WHERE user_id=$1", [
          executor.actor_id,
        ]);
      }
      for (const extra of [
        { capability: "pack.issue" },
        { subject_id: reviewer.actor_id },
        { valid_from: "2034-01-01" },
        { reason: "short" },
        { reason: "x".repeat(1001) },
      ])
        await assert.rejects(
          applyAccessRequest(executor, f.id, command(extra)),
          code("InvalidData"),
        );
      await assert.rejects(
        applyAccessRequest(executor, f.id, command({ expected_version: 1 })),
        code("VersionConflict"),
      );
      await noApplication(f.id);
    },
  );
  await t.test("Submitted and Returned are not applicable", async () => {
    for (const decision of ["", "Returned"]) {
      const f = await proposal({}, decision);
      await assert.rejects(
        applyAccessRequest(executor, f.id, command()),
        code("VersionConflict"),
      );
    }
  });
  await t.test(
    "concurrent application and identical retry install once",
    async () => {
      const f = await proposal(),
        input = command();
      const outcomes = await Promise.all([
        applyAccessRequest(executor, f.id, input),
        applyAccessRequest(executor, f.id, input),
      ]);
      assert.equal(outcomes.filter((x) => x.replayed).length, 1);
      assert.deepEqual(outcomes[0].receipt, outcomes[1].receipt);
      const g = await proposal();
      const races = await Promise.allSettled([
        applyAccessRequest(executor, g.id, command()),
        applyAccessRequest(executor, g.id, command()),
      ]);
      assert.equal(races.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal(
        (races.find((x) => x.status === "rejected") as PromiseRejectedResult)
          .reason.code,
        "VersionConflict",
      );
      assert.equal((await accessRequest(executor, g.id)).history.length, 3);
    },
  );
  await t.test(
    "late grant insertion and revocation before the application lock are observed",
    async () => {
      for (const mutation of ["duplicate", "revoke"]) {
        const f = await proposal(),
          blocker = await database().connect(),
          duplicate = randomUUID();
        let pending: Promise<unknown> | undefined;
        try {
          await blocker.query("BEGIN");
          await blocker.query(
            "LOCK TABLE ppo.permission_grants IN SHARE ROW EXCLUSIVE MODE",
          );
          pending = applyAccessRequest(executor, f.id, command());
          // Attach the rejection handler before releasing the deterministic blocking transaction.
          const refused = assert.rejects(
            pending,
            code(mutation === "duplicate" ? "ExistingGrant" : "Forbidden"),
          );
          for (let i = 0; i < 100; i++) {
            if (
              (
                await rows(
                  "SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE 'LOCK TABLE ppo.users,%'",
                )
              ).length
            )
              break;
            if (i === 99)
              throw Error("Application did not reach its authority lock");
            await new Promise((r) => setTimeout(r, 20));
          }
          if (mutation === "duplicate")
            await blocker.query(
              "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,valid_from,valid_to) VALUES($1,$2,$3,$4,'Company',$5,$5,'2025-01-01','2025-02-01')",
              [duplicate, ws, subject.actor_id, f.input.capability, company],
            );
          else
            await blocker.query(
              "UPDATE ppo.permission_grants SET valid_to='2026-01-02' WHERE user_id=$1 AND capability='admin.access.apply'",
              [executor.actor_id],
            );
          await blocker.query("COMMIT");
          await refused;
        } finally {
          await blocker.query("ROLLBACK");
          blocker.release();
          await pending?.catch(() => {});
          await rows("DELETE FROM ppo.permission_grants WHERE id=$1", [
            duplicate,
          ]);
          await rows(
            "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='admin.access.apply'",
            [executor.actor_id],
          );
        }
        await noApplication(f.id);
      }
    },
  );
  await t.test(
    "past approved start is refused without shifting the date",
    async () => {
      const f = await proposal({
        valid_from: new Date(Date.now() + 2000).toISOString(),
        valid_to: null,
      });
      await new Promise((r) => setTimeout(r, 2100));
      await assert.rejects(
        applyAccessRequest(executor, f.id, command()),
        code("InvalidData"),
      );
      await noApplication(f.id);
    },
  );
  await t.test(
    "late audit failure rolls back grant, request and receipt together",
    async () => {
      const f = await proposal(),
        input = command();
      await rows(
        "CREATE FUNCTION ppo.test_refuse_application() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.details->>'state'='Applied' THEN RAISE EXCEPTION 'Synthetic application audit failure'; END IF; RETURN NEW; END $$",
      );
      await rows(
        "CREATE TRIGGER test_refuse_application BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.test_refuse_application()",
      );
      try {
        await assert.rejects(
          applyAccessRequest(executor, f.id, input),
          /Synthetic application audit failure/,
        );
      } finally {
        await rows("DROP TRIGGER test_refuse_application ON ppo.audit_events");
        await rows("DROP FUNCTION ppo.test_refuse_application()");
      }
      await noApplication(f.id);
      await assert.rejects(
        accessRequestReceipt(executor, input.operation_id),
        code("NotFound"),
      );
      assert.equal(
        (await applyAccessRequest(executor, f.id, input)).replayed,
        false,
      );
      await changeGrant(
        executor,
        "admin.access.apply",
        "valid_to='2026-01-02'",
        async () => {
          await assert.rejects(
            applyAccessRequest(executor, f.id, input),
            code("Forbidden"),
          );
          await assert.rejects(
            accessRequestReceipt(executor, input.operation_id),
            code("Forbidden"),
          );
        },
      );
      await assert.rejects(
        accessRequestReceipt(reviewer, input.operation_id),
        code("NotFound"),
      );
    },
  );
  await t.test(
    "installed grant becomes eligible only at its original start and exact company; working company still narrows",
    async () => {
      const f = await proposal({
        capability: "finance.account.read",
        company_id: otherCompany,
        valid_from: new Date(Date.now() + 2000).toISOString(),
        valid_to: null,
      });
      await applyAccessRequest(executor, f.id, command());
      assert.equal(
        await hasPermission(
          database(),
          subject,
          "finance.account.read",
          otherCompany,
        ),
        false,
      );
      await new Promise((r) => setTimeout(r, 2100));
      assert.equal(
        await hasPermission(
          database(),
          subject,
          "finance.account.read",
          otherCompany,
        ),
        true,
      );
      assert.equal(
        await hasPermission(
          database(),
          subject,
          "finance.account.read",
          company,
        ),
        false,
      );
      assert.equal(
        await withWorkingCompany(subject.actor_id, company, () =>
          hasPermission(
            database(),
            subject,
            "finance.account.read",
            otherCompany,
          ),
        ),
        false,
      );
      const d = await accessRequest(executor, f.id);
      assert.equal(
        new Date(d.request.valid_from).toISOString(),
        f.input.valid_from,
      );
    },
  );
  await t.test(
    "a forged grant change at audit time is rejected by the deferred exact-grant guard",
    async () => {
      const f = await proposal();
      await rows(
        "CREATE FUNCTION ppo.test_forge_application_grant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.details->>'state'='Applied' THEN UPDATE ppo.permission_grants SET valid_from='2024-01-01' WHERE id=(NEW.details->>'grant_id')::uuid; END IF; RETURN NEW; END $$",
      );
      await rows(
        "CREATE TRIGGER test_forge_application_grant BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.test_forge_application_grant()",
      );
      try {
        await assert.rejects(
          applyAccessRequest(executor, f.id, command()),
          code("23514"),
        );
      } finally {
        await rows(
          "DROP TRIGGER test_forge_application_grant ON ppo.audit_events",
        );
        await rows("DROP FUNCTION ppo.test_forge_application_grant()");
      }
      await noApplication(f.id);
    },
  );
  await t.test(
    "direct transition without exact evidence fails and applied evidence cannot be rewritten",
    async () => {
      const f = await proposal(),
        grantId = randomUUID();
      await assert.rejects(
        transaction(async (c) => {
          await c.query(
            "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,valid_from,valid_to) SELECT $2,workspace_id,subject_id,capability,scope_type,scope_id,company_id,valid_from,valid_to FROM ppo.access_change_requests WHERE id=$1",
            [f.id, grantId],
          );
          await c.query(
            "UPDATE ppo.access_change_requests SET state='Applied',version=3,applied_by=$2,applied_at=clock_timestamp(),application_reason='Missing exact accepted evidence',grant_id=$3,grant_snapshot=(SELECT to_jsonb(g) FROM ppo.permission_grants g WHERE id=$3) WHERE id=$1",
            [f.id, executor.actor_id, grantId],
          );
        }),
        code("23514"),
      );
      await noApplication(f.id);
      await applyAccessRequest(executor, f.id, command());
      await assert.rejects(
        rows(
          "UPDATE ppo.access_change_requests SET application_reason='Rewrite committed application reason' WHERE id=$1",
          [f.id],
        ),
        code("55000"),
      );
      await assert.rejects(
        rows(
          "UPDATE ppo.access_change_operations SET receipt='{}' WHERE request_id=$1",
          [f.id],
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
