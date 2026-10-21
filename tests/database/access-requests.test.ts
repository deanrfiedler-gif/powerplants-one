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
import { createSession } from "../../src/platform/identity";
import {
  accessRequests,
  accessRequestContext,
  accessRequest,
  accessRequestReceipt,
  submitAccessRequest,
  decideAccessRequest,
} from "../../src/access/requests";
import {
  accessRequestSeedGrants,
  accessApplicationSeedGrants, accessTeamSeedGrants, accessReviewSeedGrants, conversationSeedGrants, agentAskSeedGrants,
} from "../helpers/engineering-materials-grants";
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
const shape = (values: Record<string, unknown>[]) =>
  values
    .map(({ id: _id, ...v }) => {
      void _id;
      return JSON.stringify(v);
    })
    .sort();

test("AD01 requests: populated upgrade retains all earlier rows and adds exactly five duties through team creation", async () => {
  await transaction(async (c) => {
    await recoverSchema(c);
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate(78);
  await seed(78);
  const grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    users = await rows("SELECT * FROM ppo.users ORDER BY id"),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    seeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
  await migrate();
  await seed();
  const afterGrants = await rows(
      "SELECT * FROM ppo.permission_grants ORDER BY id",
    ),
    ids = new Set(grants.map((g) => g.id));
  assert.deepEqual(
    afterGrants.filter((g) => ids.has(g.id)),
    grants,
  );
  assert.deepEqual(
    shape(afterGrants.filter((g) => !ids.has(g.id) && g.capability !== "conversation.agent.ask")),
    shape([
      ...accessRequestSeedGrants(grants), ...conversationSeedGrants(grants),
      ...accessReviewSeedGrants(grants), ...accessTeamSeedGrants(grants), ...accessApplicationSeedGrants(grants),
    ]),
  );
  assert.deepEqual(shape(afterGrants.filter(g => !ids.has(g.id) && g.capability === "conversation.agent.ask")),
    shape(agentAskSeedGrants([...grants, ...conversationSeedGrants(grants)])));
  assert.deepEqual(await rows("SELECT * FROM ppo.users ORDER BY id"), users);
  const next = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    ),
    nextSeeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
  assert.deepEqual(
    next.filter((x) => x.version <= 78),
    ledger,
  );
  assert.deepEqual(
    next.filter((x) => x.version > 78).map((x) => x.version),
    [79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 113, 114],
  );
  assert.deepEqual(
    nextSeeds.filter((x) => x.version <= 78),
    seeds,
  );
  assert.deepEqual(
    nextSeeds.filter((x) => x.version > 78).map((x) => x.version),
    [79, 80, 83, 84, 107, 108, 110],
  );
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    afterGrants,
  );
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    next,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
    nextSeeds,
  );
});

test("AD01 requests: independent review, recovery, isolation and unchanged effective grants", async (t) => {
  const systems = (await createSession("systems")).principal,
    reviewer = (await createSession("scheduling-policy-reviewer")).principal,
    observer = (await createSession("site-observer")).principal;
  const grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    users = await rows("SELECT * FROM ppo.users ORDER BY id");
  const input = (extra: Record<string, unknown> = {}) => ({
    operation_id: randomUUID(),
    schema_version: 1,
    request_id: randomUUID(),
    subject_id: observer.actor_id,
    reviewer_id: reviewer.actor_id,
    capability: "pack.prepare",
    scope_type: "Company",
    company_id: company,
    site_id: null,
    valid_from: "2035-01-01T00:00:00Z",
    valid_to: "2035-02-01T00:00:00Z",
    reason: "Synthetic access request for independent review.",
    ...extra,
  });
  const decision = (extra: Record<string, unknown> = {}) => ({
    operation_id: randomUUID(),
    schema_version: 1,
    expected_version: 1,
    decision: "Approved",
    reason: "Reviewed the exact synthetic scope and dates.",
    ...extra,
  });
  await t.test(
    "ordinary/read-only identities cannot submit or decide; hosted mode is refused",
    async () => {
      await assert.rejects(
        submitAccessRequest(observer, input()),
        code("Forbidden"),
      );
      await assert.rejects(
        submitAccessRequest(reviewer, input()),
        code("Forbidden"),
      );
      await assert.rejects(
        decideAccessRequest(systems, randomUUID(), decision()),
        code("Forbidden"),
      );
      const env = process.env.PPO_ENV;
      try {
        process.env.PPO_ENV = "azure-demo";
        await assert.rejects(
          submitAccessRequest(systems, input()),
          code("LocalOnly"),
        );
        await assert.rejects(accessRequests(systems, {}), code("LocalOnly"));
      } finally {
        if (env === undefined) delete process.env.PPO_ENV;
        else process.env.PPO_ENV = env;
      }
    },
  );
  await t.test(
    "context lists only local subjects, exact scope keys and eligible independent reviewer",
    async () => {
      const context = await accessRequestContext(systems);
      assert.equal(context.can_submit, true);
      assert(context.reviewers.some((x) => x.id === reviewer.actor_id));
      assert(
        !context.capabilities.some(
          (x) => x.key.startsWith("admin.") || x.key === "email.connect",
        ),
      );
      assert(context.companies.some((x) => x.erp_company_id === "SYN-A"));
      assert(context.companies.some((x) => x.erp_company_id === "SYN-B"));
    },
  );
  await t.test(
    "refuses self change, self review, unknown/admin/hosted capabilities, malformed or mismatched scope, dates and reasons",
    async () => {
      for (const extra of [
        { subject_id: systems.actor_id },
        { reviewer_id: systems.actor_id },
        { subject_id: reviewer.actor_id },
        { capability: "not.real" },
        { capability: "admin.access.approve" },
        { capability: "email.connect" },
        { scope_type: "Site", site_id: site, company_id: otherCompany },
        { scope_type: "Workspace", company_id: company },
        { scope_type: "Company", site_id: site },
        { company_id: randomUUID() },
        { subject_id: randomUUID() },
        { valid_from: "2020-01-01T00:00:00Z" },
        { valid_to: "2034-01-01T00:00:00Z" },
        { reason: "Short" },
        { reason: "x".repeat(1001) },
        { valid_from: "2035-02-30T00:00:00Z" },
        { origin: { attested_by: reviewer.actor_id } },
      ])
        await assert.rejects(
          submitAccessRequest(systems, input(extra)),
          code("InvalidData"),
        );
      assert.equal(
        (await rows("SELECT * FROM ppo.access_change_requests")).length,
        0,
      );
    },
  );
  await t.test(
    "inactive and hosted subjects, inactive/expired/future reviewer grants are refused",
    async () => {
      await database().query(
        await readFile(
          new URL("../../db/demo/0001-identity.sql", import.meta.url),
          "utf8",
        ),
      );
      await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
        observer.actor_id,
      ]);
      try {
        await assert.rejects(
          submitAccessRequest(systems, input()),
          code("InvalidData"),
        );
      } finally {
        await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
          observer.actor_id,
        ]);
      }
      const original = (
        await rows("SELECT issuer FROM ppo.users WHERE id=$1", [
          observer.actor_id,
        ])
      )[0].issuer;
      await database().query(
        "UPDATE ppo.users SET issuer='PPO-EntraDemo' WHERE id=$1",
        [observer.actor_id],
      );
      try {
        await assert.rejects(
          submitAccessRequest(systems, input()),
          code("InvalidData"),
        );
      } finally {
        await database().query("UPDATE ppo.users SET issuer=$2 WHERE id=$1", [
          observer.actor_id,
          original,
        ]);
      }
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to='2026-02-01' WHERE user_id=$1 AND capability='admin.access.approve'",
        [reviewer.actor_id],
      );
      try {
        await assert.rejects(
          submitAccessRequest(systems, input()),
          code("InvalidData"),
        );
      } finally {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='admin.access.approve'",
          [reviewer.actor_id],
        );
      }
      await database().query(
        "UPDATE ppo.permission_grants SET valid_from='2040-01-01' WHERE user_id=$1 AND capability='admin.access.approve'",
        [reviewer.actor_id],
      );
      try {
        await assert.rejects(
          submitAccessRequest(systems, input()),
          code("InvalidData"),
        );
      } finally {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_from='2026-01-01T00:00:00Z' WHERE user_id=$1 AND capability='admin.access.approve'",
          [reviewer.actor_id],
        );
      }
    },
  );
  await t.test(
    "an expired existing grant still prevents a duplicate proposal",
    async () => {
      const existing = (
        await rows(
          "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
          [observer.actor_id],
        )
      )[0];
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to='2026-02-01' WHERE id=$1",
        [existing.id],
      );
      try {
        await assert.rejects(
          submitAccessRequest(
            systems,
            input({
              capability: existing.capability,
              scope_type: existing.scope_type,
              company_id: existing.company_id,
              site_id: existing.site_id,
            }),
          ),
          code("ExistingGrant"),
        );
      } finally {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
          [existing.id, existing.valid_to],
        );
      }
    },
  );
  const original = input();
  let id = "";
  await t.test(
    "submission is durable and exact replay returns one original receipt; changed content conflicts",
    async () => {
      const created = await submitAccessRequest(systems, original);
      id = created.receipt.record_id;
      assert.equal(created.receipt.state, "Submitted");
      assert.equal(created.receipt.record_version, 1);
      const replay = await submitAccessRequest(systems, original);
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.receipt, created.receipt);
      assert.deepEqual(
        await accessRequestReceipt(systems, original.operation_id),
        created.receipt,
      );
      await assert.rejects(
        submitAccessRequest(systems, {
          ...original,
          reason: "Changed content must never reuse the operation.",
        }),
        code("OperationConflict"),
      );
      await assert.rejects(
        accessRequestReceipt(reviewer, original.operation_id),
        code("NotFound"),
      );
      await assert.rejects(
        submitAccessRequest(systems, input()),
        code("RequestConflict"),
      );
      assert.equal((await accessRequest(systems, id)).history.length, 1);
    },
  );
  await t.test(
    "authority is rechecked before replay, receipt read and workspace inspection",
    async () => {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to='2026-02-01' WHERE user_id=$1 AND capability='admin.access.propose'",
        [systems.actor_id],
      );
      try {
        await assert.rejects(
          submitAccessRequest(systems, original),
          code("Forbidden"),
        );
        await assert.rejects(
          accessRequestReceipt(systems, original.operation_id),
          code("Forbidden"),
        );
      } finally {
        await database().query(
          "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='admin.access.propose'",
          [systems.actor_id],
        );
      }
      await database().query(
        "INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)",
        [ws, systems.actor_id, company],
      );
      try {
        await assert.rejects(
          accessRequests(systems, {}),
          code("WorkingCompanySelected"),
        );
        await assert.rejects(
          submitAccessRequest(systems, original),
          code("WorkingCompanySelected"),
        );
      } finally {
        await database().query(
          "DELETE FROM ppo.working_companies WHERE workspace_id=$1 AND user_id=$2",
          [ws, systems.actor_id],
        );
      }
      const foreign = (await createSession("other-workspace")).principal;
      await assert.rejects(accessRequest(foreign, id), code("Forbidden"));
      await assert.rejects(
        accessRequest(systems, randomUUID()),
        code("NotFound"),
      );
    },
  );
  await t.test(
    "only the named reviewer decides; stale/concurrent decisions cannot replace the first",
    async () => {
      const extra = randomUUID();
      await database().query(
        "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,'admin.access.approve','Workspace',$2,'2026-01-01')",
        [extra, ws, systems.actor_id],
      );
      try {
        await assert.rejects(
          decideAccessRequest(systems, id, decision()),
          code("IndependentReviewerRequired"),
        );
      } finally {
        await database().query(
          "DELETE FROM ppo.permission_grants WHERE id=$1",
          [extra],
        );
      }
      await assert.rejects(
        decideAccessRequest(reviewer, id, decision({ expected_version: 2 })),
        code("VersionConflict"),
      );
      const first = decision(),
        second = decision({ decision: "Returned" });
      const results = await Promise.allSettled([
        decideAccessRequest(reviewer, id, first),
        decideAccessRequest(reviewer, id, second),
      ]);
      assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
      const rejected = results.find(
        (x) => x.status === "rejected",
      ) as PromiseRejectedResult;
      assert(code("VersionConflict")(rejected.reason));
      const winner = results[0].status === "fulfilled" ? first : second;
      const accepted = (
        results.find((x) => x.status === "fulfilled") as PromiseFulfilledResult<
          Awaited<ReturnType<typeof decideAccessRequest>>
        >
      ).value;
      assert.deepEqual(
        (await decideAccessRequest(reviewer, id, winner)).receipt,
        accepted.receipt,
      );
      assert.deepEqual(
        await accessRequestReceipt(reviewer, winner.operation_id),
        accepted.receipt,
      );
      const detail = await accessRequest(systems, id);
      assert.equal(detail.history.length, 2);
      assert.equal(detail.request.version, 2);
      assert.equal(detail.can_decide, false);
      assert.deepEqual(
        detail.history.map((x) => x.actor_id),
        [systems.actor_id, reviewer.actor_id],
      );
    },
  );
  await t.test(
    "approval revalidates changed eligibility while Return retains an invalid proposal",
    async () => {
      const created = await submitAccessRequest(
        systems,
        input({ capability: "pack.check" }),
      );
      await database().query("UPDATE ppo.users SET active=false WHERE id=$1", [
        observer.actor_id,
      ]);
      try {
        await assert.rejects(
          decideAccessRequest(reviewer, created.receipt.record_id, decision()),
          code("InvalidData"),
        );
        const returned = await decideAccessRequest(
          reviewer,
          created.receipt.record_id,
          decision({ decision: "Returned" }),
        );
        assert.equal(returned.receipt.state, "Returned");
      } finally {
        await database().query("UPDATE ppo.users SET active=true WHERE id=$1", [
          observer.actor_id,
        ]);
      }
      assert.equal(
        (
          await submitAccessRequest(
            systems,
            input({ capability: "pack.check" }),
          )
        ).receipt.state,
        "Submitted",
      );
    },
  );
  await t.test(
    "site and Workspace proposals retain exact scope; approved requests never become grants",
    async () => {
      for (const extra of [
        { scope_type: "Site", site_id: site },
        { scope_type: "Workspace", company_id: null },
      ]) {
        const result = await submitAccessRequest(
          systems,
          input({ ...extra, capability: "pack.issue" }),
        );
        const approved = await decideAccessRequest(
          reviewer,
          result.receipt.record_id,
          decision(),
        );
        assert.equal(approved.receipt.state, "Approved");
        const detail = await accessRequest(systems, result.receipt.record_id);
        assert.equal(detail.request.scope_type, extra.scope_type);
      }
      const queue = await accessRequests(reviewer, { state: "Approved" });
      assert(queue.items.length > 0);
      assert(queue.items.every((x) => x.state === "Approved"));
      await assert.rejects(
        accessRequests(systems, { offset: "-1" }),
        code("InvalidData"),
      );
    },
  );
  await t.test(
    "approval refuses a grant added after submission and a start that has passed",
    async () => {
      const created = await submitAccessRequest(
        systems,
        input({ capability: "activity.edit", company_id: otherCompany }),
      );
      const grantId = randomUUID();
      await database().query(
        "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,company_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,$4,'activity.edit','Company',$4,'2026-01-01T00:00:00Z')",
        [grantId, ws, observer.actor_id, otherCompany],
      );
      try {
        await assert.rejects(
          decideAccessRequest(reviewer, created.receipt.record_id, decision()),
          code("ExistingGrant"),
        );
        await decideAccessRequest(
          reviewer,
          created.receipt.record_id,
          decision({ decision: "Returned" }),
        );
      } finally {
        await database().query(
          "DELETE FROM ppo.permission_grants WHERE id=$1",
          [grantId],
        );
      }
      const start = new Date(Date.now() + 2000).toISOString();
      const timed = await submitAccessRequest(
        systems,
        input({
          capability: "activity.edit",
          company_id: otherCompany,
          valid_from: start,
          valid_to: null,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 2100));
      await assert.rejects(
        decideAccessRequest(reviewer, timed.receipt.record_id, decision()),
        code("InvalidData"),
      );
      await decideAccessRequest(
        reviewer,
        timed.receipt.record_id,
        decision({ decision: "Returned" }),
      );
    },
  );
  await t.test(
    "database guards retain proposal and exact immutable audit evidence",
    async () => {
      await assert.rejects(
        database().query(
          "UPDATE ppo.access_change_requests SET reason='Rewrite accepted proposal' WHERE id=$1",
          [id],
        ),
        code("55000"),
      );
      await assert.rejects(
        database().query("DELETE FROM ppo.access_change_requests WHERE id=$1", [
          id,
        ]),
        code("55000"),
      );
      await assert.rejects(
        database().query(
          "UPDATE ppo.access_change_operations SET snapshot='{}' WHERE request_id=$1",
          [id],
        ),
        code("55000"),
      );
      const mismatch =
        await rows(`SELECT r.id FROM ppo.access_change_requests r JOIN ppo.access_change_operations o
      ON (o.workspace_id,o.request_id,o.request_version)=(r.workspace_id,r.id,r.version)
      JOIN ppo.audit_events a ON a.id=o.audit_id WHERE o.snapshot<>to_jsonb(r) OR a.details<>o.snapshot`);
      assert.deepEqual(mismatch, []);
    },
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    grants,
  );
  assert.deepEqual(await rows("SELECT * FROM ppo.users ORDER BY id"), users);
});
