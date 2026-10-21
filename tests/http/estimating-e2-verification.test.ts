import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset } from "../../scripts/database";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const origin = process.env.PPO_TEST_ORIGIN ?? `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Cookie: cookie, ...(body === undefined ? {} : { Origin: origin, "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}
async function fixture() {
  const response = await fetch(`${origin}/api/v1/local-session`, { method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ profile: "coordinator" }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")!.split(";")[0], o = crmCreate();
  assert.equal((await call(cookie, "crm/opportunities", o)).status, 201);
  const discovery = discoveryInput(), preview = await call(cookie, "estimating/workspaces/preview", { opportunity_id: o.id, discovery });
  assert.equal(preview.status, 200);
  const input = { ...crmBase(), id: randomUUID(), option_id: randomUUID(), revision_id: randomUUID(),
    opportunity_id: o.id, discovery, expected_opportunity_version: preview.body.expected_opportunity_version,
    context_hash: preview.body.context_hash, confirmed_question_ids: preview.body.required_confirmation_ids };
  const accepted = await call(cookie, "estimating/workspaces", input); assert.equal(accepted.status, 201);
  return { cookie, o, input, accepted, path: `estimating/workspaces/${input.id}` };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
async function proposal(s: Fixture, kind: "Save" | "Branch", label = "B") {
  const saved = await call(s.cookie, s.path), current = saved.body.options[0];
  const draft = { kind, option_id: current.option.id, expected_version: saved.body.workspace.version,
    expected_revision_id: current.revision.id, discovery: discoveryInput(),
    ...(kind === "Branch" ? { branch_mode: "Fresh" } : {}) };
  const preview = await call(s.cookie, `${s.path}/preview`, draft); assert.equal(preview.status, 200);
  return { ...crmBase(), ...draft, revision_id: randomUUID(),
    ...(kind === "Branch" ? { new_option_id: randomUUID(), label } : {}),
    context_hash: preview.body.context_hash, comparison_hash: preview.body.comparison_hash,
    confirmed_question_ids: preview.body.required_confirmation_ids };
}
async function ordered(s: Fixture, first: { path: string; body: unknown }, second: { path: string; body: unknown }) {
  const blocker = await database().connect(); await blocker.query("BEGIN");
  const pid = (await blocker.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  await blocker.query("SELECT id FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [CRM.workspace]);
  async function blocked(count: number) {
    const until = Date.now() + 8000;
    do {
      const r = await database().query("WITH RECURSIVE waiting AS (SELECT pid FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid)) UNION SELECT a.pid FROM pg_stat_activity a JOIN waiting w ON w.pid=ANY(pg_blocking_pids(a.pid))) SELECT DISTINCT pid FROM waiting", [pid]);
      if (r.rows.length >= count) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    } while (Date.now() < until);
    assert.fail(`Did not observe ${count} independent PostgreSQL waiters`);
  }
  const a = call(s.cookie, first.path, first.body); let b: ReturnType<typeof call> | undefined;
  try { await blocked(1); b = call(s.cookie, second.path, second.body); await blocked(2); }
  finally { await blocker.query("COMMIT"); blocker.release(); }
  return Promise.all([a, b!]);
}
async function effectCounts(operation: string) {
  return Promise.all(["audit_events", "operation_receipts", "outbox_jobs"].map(async table =>
    (await database().query(`SELECT count(*)::int n FROM ppo.${table} WHERE operation_id=$1`, [operation])).rows[0].n));
}

for (const kind of ["Save", "Branch"] as const)
  for (const firstIndex of [0, 1])
    test(`E2-A06 HTTP observed competing ${kind}, intent ${firstIndex + 1} first`, async () => {
      const s = await fixture(), intents = [await proposal(s, kind, "B"), await proposal(s, kind, "C")];
      const winner = intents[firstIndex], loser = intents[1 - firstIndex];
      const [accepted, rejected] = await ordered(s, { path: s.path, body: winner }, { path: s.path, body: loser });
      assert.equal(accepted.status, 200); assert.equal(rejected.status, 409); assert.equal(rejected.body.code, "VersionConflict");
      assert.deepEqual(await effectCounts(winner.operation_id), [1, 1, 1]);
      assert.deepEqual(await effectCounts(loser.operation_id), [0, 0, 0]);
      const saved = (await call(s.cookie, s.path)).body;
      assert.equal(saved.workspace.version, 2); assert.equal(saved.options.length, kind === "Branch" ? 2 : 1);
      assert.equal(saved.workspace.selected_option_id, s.input.option_id);
      assert.deepEqual((await call(s.cookie, `operations/${winner.operation_id}`)).body, accepted.body);
      assert.deepEqual((await call(s.cookie, s.path, winner)).body, accepted.body);
      assert.equal((await call(s.cookie, s.path, { ...winner, reason: "SYN altered original intent" })).status, 409);
      assert.deepEqual(await effectCounts(winner.operation_id), [1, 1, 1]);
    });

for (const firstIndex of [0, 1])
  test(`E2-A02/A06 HTTP observed competing selection, option ${firstIndex + 1} first`, async () => {
    const s = await fixture();
    for (const label of ["B", "C"]) assert.equal((await call(s.cookie, s.path, await proposal(s, "Branch", label))).status, 200);
    const view = (await call(s.cookie, s.path)).body;
    const intents = view.options.slice(1).map((o: { option: { id: string }; revision: { id: string } }) => ({
      ...crmBase(), action: "Select", option_id: o.option.id, expected_version: 3,
      expected_revision_id: o.revision.id, expected_selected_option_id: s.input.option_id,
    }));
    assert.equal(intents.length, 2);
    const winner = intents[firstIndex], loser = intents[1 - firstIndex];
    const [accepted, rejected] = await ordered(s, { path: `${s.path}/options`, body: winner }, { path: `${s.path}/options`, body: loser });
    assert.equal(accepted.status, 200); assert.equal(rejected.status, 409);
    const saved = (await call(s.cookie, s.path)).body;
    assert.equal(saved.workspace.version, 4); assert.equal(saved.workspace.selected_option_id, winner.option_id);
    assert.deepEqual(await effectCounts(winner.operation_id), [1, 1, 1]);
    assert.deepEqual(await effectCounts(loser.operation_id), [0, 0, 0]);
    assert.deepEqual((await call(s.cookie, `${s.path}/options`, winner)).body, accepted.body);
    assert.equal((await call(s.cookie, `${s.path}/options`, { ...winner, reason: "SYN altered original selection intent" })).status, 409);
    // The other option with the winner's revision is an inaccessible target
    // pair, checked before receipt recovery; it must disclose no original.
    const mismatched = await call(s.cookie, `${s.path}/options`, { ...winner, option_id: loser.option_id });
    assert.equal(mismatched.status, 404);
    assert.equal(typeof accepted.body.receipt_id, "string");
    assert.ok(!JSON.stringify(mismatched.body).includes(accepted.body.receipt_id));
    assert.deepEqual(await effectCounts(winner.operation_id), [1, 1, 1]);
  });

test("E2-A05 HTTP current read authority gates list, detail, history, selectors, preview, receipt and original replay", async () => {
  const s = await fixture(), draft = await proposal(s, "Save");
  for (const capability of ["estimating.read", "crm.opportunity.read", "shared.read", "shared.internal.read"]) {
    const grants = (await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability=$2 RETURNING *", [CRM.owner, capability])).rows;
    assert.ok(grants.length, capability);
    for (const path of [s.path, `${s.path}/revisions?revision_id=${s.input.revision_id}`, `operations/${s.input.operation_id}`,
      `estimating/workspaces/form-options?opportunity_id=${s.o.id}&workspace_id=${s.input.id}`]) {
      const r = await call(s.cookie, path); assert.ok([403, 404].includes(r.status), `${capability}: ${path}: ${JSON.stringify(r)}`);
      assert.ok(!JSON.stringify(r.body).includes(s.input.revision_id));
    }
    const list = await call(s.cookie, `estimating/workspaces?opportunity_id=${s.o.id}`);
    assert.ok([403, 404].includes(list.status) || (list.status === 200 && list.body.items.length === 0));
    assert.equal((await call(s.cookie, "estimating/workspaces", s.input)).status, 404);
    assert.equal((await call(s.cookie, s.path, draft)).status, 404);
    assert.deepEqual(await effectCounts(draft.operation_id), [0, 0, 0]);
    await database().query("INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_recordset(NULL::ppo.permission_grants,$1::jsonb)", [JSON.stringify(grants)]);
    assert.deepEqual((await call(s.cookie, `operations/${s.input.operation_id}`)).body, s.accepted.body);
  }
});
