import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import { CRM, crmAction, crmBase, crmCreate, crmQualify } from "../helpers/crm";

// This file owns an exclusive disposable database phase in http-suite.ts.
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const origin = process.env.PPO_TEST_ORIGIN ?? `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const receiver = "30000000-0000-4000-8000-000000000015";
const rows = async (sql: string, args: unknown[] = []) => (await database().query(sql, args)).rows;
async function session(profile = "coordinator") {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Cookie: cookie, ...(body === undefined ? {} : { Origin: origin, "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}
async function fixture() {
  const cookie = await session(), input = crmCreate();
  assert.equal((await call(cookie, "crm/opportunities", input)).status, 201);
  const path = `crm/opportunities/${input.id}`;
  const options = await call(cookie, `${path}/handover-options`);
  assert.equal(options.status, 200);
  assert.ok(options.body.items.some((item: { id: string }) => item.id === receiver));
  const body = { ...crmBase(), expected_version: 1, new_owner_id: receiver,
    expected_next_activity: { id: input.initial_action.id, version: 1 }, expected_identification_activity: null };
  return { cookie, input, path, body };
}
async function blockedBy(pid: number, count: number) {
  const until = Date.now() + 8000;
  do {
    const waiting = await rows("WITH RECURSIVE waiting AS (SELECT pid FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid)) UNION SELECT a.pid FROM pg_stat_activity a JOIN waiting w ON w.pid=ANY(pg_blocking_pids(a.pid))) SELECT DISTINCT pid FROM waiting", [pid]);
    if (waiting.length >= count) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  } while (Date.now() < until);
  assert.fail(`Did not observe ${count} independent blocked PostgreSQL backends`);
}
async function ordered(first: () => Promise<unknown>, second: () => Promise<unknown>) {
  const blocker = await database().connect();
  await blocker.query("BEGIN");
  const pid = (await blocker.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  await blocker.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [CRM.workspace]);
  const a = first(); let b: Promise<unknown> | undefined;
  try { await blockedBy(pid, 1); b = second(); await blockedBy(pid, 2); }
  finally { await blocker.query("COMMIT"); blocker.release(); }
  return await Promise.all([a, b]) as Awaited<ReturnType<typeof call>>[];
}
async function effects(operation: string) {
  return Promise.all(["operation_receipts", "audit_events", "outbox_jobs"].map(async table =>
    (await rows(`SELECT count(*)::int n FROM ppo.${table} WHERE operation_id=$1`, [operation]))[0].n));
}

for (const competitor of ["qualification", "planning-new", "planning-existing", "transfer"] as const)
  for (const transferFirst of [true, false])
    test(`HV-05/06/07 HTTP observed ${competitor}, transfer ${transferFirst ? "first" : "second"}`, async () => {
      const s = await fixture(), next = crmAction();
      if (competitor === "planning-existing") assert.equal((await call(s.cookie, "activities", {
        ...crmBase(), ...next, company_id: CRM.company, site_id: CRM.site, access_class: "Internal",
        links: [{ object_type: "Opportunity", object_id: s.input.id }],
      })).status, 201);
      const competingBody = competitor === "qualification" ? crmQualify()
        : competitor === "transfer" ? { ...s.body, ...crmBase() }
        : { ...crmBase(), expected_version: 1, new_action: competitor === "planning-new" ? next : null,
          activity_id: competitor === "planning-existing" ? next.id : null };
      const suffix = competitor === "qualification" ? "qualify" : competitor === "transfer" ? "transfer-owner" : "next-action";
      const transfer = () => call(s.cookie, `${s.path}/transfer-owner`, s.body);
      const competing = () => call(s.cookie, `${s.path}/${suffix}`, competingBody);
      const [first, second] = await ordered(transferFirst ? transfer : competing, transferFirst ? competing : transfer);
      assert.equal(first.status, 200);
      assert.ok([403, 409].includes(second.status), JSON.stringify(second));
      assert.deepEqual(await effects(transferFirst ? s.body.operation_id : competingBody.operation_id), [1, 1, 1]);
      assert.deepEqual(await effects(transferFirst ? competingBody.operation_id : s.body.operation_id), [0, 0, 0]);
      const saved = (await call(s.cookie, s.path)).body.items[0];
      assert.equal(saved.version, 2); assert.equal(saved.events.length, 2);
      assert.equal(saved.owner_id, transferFirst || competitor === "transfer" ? receiver : CRM.owner);
      if (competitor === "planning-new" && transferFirst) {
        assert.equal((await rows("SELECT id FROM ppo.activities WHERE id=$1", [next.id])).length, 0);
        assert.equal((await rows("SELECT id FROM ppo.business_identities WHERE id=$1", [next.id])).length, 0);
      }
      if (competitor === "qualification" && !transferFirst) assert.equal(saved.stage_id, "Qualified");
    });

for (const action of ["complete", "cancel", "update"] as const)
  for (const transferFirst of [true, false])
    test(`HV-08 HTTP observed Activity ${action}, transfer ${transferFirst ? "first" : "second"}`, async () => {
      const s = await fixture();
      const command = { ...crmBase(), expected_version: 1,
        ...(action === "complete" ? { outcome: "SYN HTTP independent completion" }
          : action === "cancel" ? { cancellation_reason: "SYN HTTP independent cancellation" }
          : { owner_id: receiver, summary: s.input.initial_action.summary, due_at: null, due_needed: true }) };
      const transfer = () => call(s.cookie, `${s.path}/transfer-owner`, s.body);
      const activity = () => call(s.cookie, `activities/${s.input.initial_action.id}/${action}`, command);
      const [a, b] = await ordered(transferFirst ? transfer : activity, transferFirst ? activity : transfer);
      assert.equal(a.status, 200); assert.equal(b.status, transferFirst ? 200 : 409);
      if (!transferFirst) assert.equal(b.body.code, "ActivityComparisonConflict");
      const saved = (await call(s.cookie, s.path)).body.items[0];
      assert.equal(saved.owner_id, transferFirst ? receiver : CRM.owner);
      assert.equal(saved.version, transferFirst ? 2 : 1);
      assert.equal(saved.next_activity.version, 2);
      assert.equal(saved.next_activity.owner_id, action === "update" ? receiver : CRM.owner);
      assert.equal(saved.next_activity.status, action === "complete" ? "Completed" : action === "cancel" ? "Cancelled" : "Open");
      assert.deepEqual(await effects(s.body.operation_id), transferFirst ? [1, 1, 1] : [0, 0, 0]);
      assert.deepEqual(await effects(command.operation_id), [1, 1, 1]);
    });

test("HV-07/11 HTTP simultaneous identical originals return one receipt; changed content has zero new effects", async () => {
  const s = await fixture();
  const [a, b] = await ordered(() => call(s.cookie, `${s.path}/transfer-owner`, s.body), () => call(s.cookie, `${s.path}/transfer-owner`, s.body));
  assert.equal(a.status, 200); assert.equal(b.status, 200); assert.deepEqual(a.body, b.body);
  assert.deepEqual((await call(s.cookie, `operations/${s.body.operation_id}`)).body, a.body);
  assert.equal((await call(s.cookie, `${s.path}/transfer-owner`, { ...s.body, reason: "SYN changed intent" })).status, 409);
  assert.deepEqual(await effects(s.body.operation_id), [1, 1, 1]);
  assert.equal((await call(s.cookie, s.path)).body.items[0].owner_transfers.length, 1);
});

for (const target of ["initiator", "recipient", "affiliation", "grant"] as const)
  for (const transferFirst of [true, false])
    test(`HV-13 HTTP observed ${target} revocation, transfer ${transferFirst ? "first" : "second"}`, async () => {
      const s = await fixture(), blocker = await database().connect(), admin = await database().connect();
      const sql = target === "grant" ? "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.transfer.own'"
        : target === "affiliation" ? "UPDATE ppo.relationships SET valid_to=CURRENT_DATE WHERE organisation_id=$1 AND person_id=$2"
        : "UPDATE ppo.users SET active=false WHERE id=$1";
      const args = target === "affiliation" ? [CRM.org, CRM.person] : [target === "recipient" ? receiver : CRM.owner];
      await blocker.query("BEGIN"); await admin.query("BEGIN");
      let pending: Promise<Awaited<ReturnType<typeof call>>> | undefined, revoke: Promise<unknown> | undefined;
      try {
        if (transferFirst) {
          const pid = (await blocker.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
          await blocker.query("SELECT id FROM ppo.opportunities WHERE id=$1 FOR UPDATE", [s.input.id]);
          pending = call(s.cookie, `${s.path}/transfer-owner`, s.body); await blockedBy(pid, 1);
          revoke = admin.query(sql, args); await blockedBy(pid, 2);
        } else {
          await admin.query(sql, args);
          const pid = (await admin.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
          pending = call(s.cookie, `${s.path}/transfer-owner`, s.body); await blockedBy(pid, 1);
        }
      } finally {
        await blocker.query("COMMIT"); blocker.release();
        if (revoke) await revoke;
        await admin.query("COMMIT"); admin.release();
      }
      const accepted = await pending!;
      if (transferFirst) assert.equal(accepted.status, 200);
      else assert.ok([401, 403, 404, 422].includes(accepted.status), JSON.stringify(accepted));
      const saved = (await rows("SELECT owner_id,version FROM ppo.opportunities WHERE id=$1", [s.input.id]))[0];
      assert.deepEqual(saved, { owner_id: transferFirst ? receiver : CRM.owner, version: transferFirst ? 2 : 1 });
      assert.deepEqual(await effects(s.body.operation_id), transferFirst ? [1, 1, 1] : [0, 0, 0]);
      const recovery = await call(s.cookie, `operations/${s.body.operation_id}`);
      if (transferFirst && target === "recipient") assert.deepEqual(recovery.body, accepted.body);
      else assert.ok([401, 404].includes(recovery.status), JSON.stringify(recovery));
    });

for (const capability of ["crm.opportunity.read", "crm.opportunity.edit", "crm.opportunity.transfer.own", "shared.read", "shared.internal.read", "activity.read", "activity.edit"])
  test(`HV-12 HTTP accepted receipt and exact replay denied after revoking ${capability}`, async () => {
    const s = await fixture(), accepted = await call(s.cookie, `${s.path}/transfer-owner`, s.body);
    assert.equal(accepted.status, 200);
    const grants = await rows("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2 RETURNING *", [CRM.owner, capability]);
    assert.ok(grants.length);
    assert.equal((await call(s.cookie, `operations/${s.body.operation_id}`)).status, 404);
    const replay = await call(s.cookie, `${s.path}/transfer-owner`, s.body);
    assert.ok([403, 404].includes(replay.status), JSON.stringify(replay));
    assert.deepEqual(await effects(s.body.operation_id), [1, 1, 1]);
    // Test-fixture restoration only, never seed-based recovery of authority.
    await rows("INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_recordset(NULL::ppo.permission_grants,$1::jsonb)", [JSON.stringify(grants)]);
    assert.deepEqual((await call(s.cookie, `operations/${s.body.operation_id}`)).body, accepted.body);
  });

for (const expiry of ["session", "user"] as const)
  test(`HV-12 HTTP ${expiry} expiry withholds detail, selectors, history, receipt and replay`, async () => {
    const s = await fixture(), accepted = await call(s.cookie, `${s.path}/transfer-owner`, s.body);
    assert.equal(accepted.status, 200);
    if (expiry === "session") await rows("UPDATE ppo.sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE actor_id=$1", [CRM.owner]);
    else await rows("UPDATE ppo.users SET active=false WHERE id=$1", [CRM.owner]);
    for (const path of [s.path, `${s.path}/handover-options`, "crm/opportunities", "crm/worklist-options?kind=Owner", `operations/${s.body.operation_id}`]) {
      const result = await call(s.cookie, path); assert.equal(result.status, 401);
      assert.ok(!JSON.stringify(result.body).includes(s.input.title));
    }
    assert.equal((await call(s.cookie, `${s.path}/transfer-owner`, s.body)).status, 401);
    assert.deepEqual(await effects(s.body.operation_id), [1, 1, 1]);
  });
