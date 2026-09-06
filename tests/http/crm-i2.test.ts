import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { CRM, crmCreate, crmAction, crmQualify } from "../helpers/crm";
const origin = "http://127.0.0.1:3000";
after(closeDatabase);
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${path}`, { method: body === undefined ? "GET" : "POST", headers: { Cookie: cookie, ...(body === undefined ? {} : { Origin: origin, "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
async function session(profile: string) {
  const r = await call("", "local-session", { profile });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
test("CA-02/05 I2 HTTP canonical IDs, sort/filter equivalence, stable windows and forbidden view commands", async () => {
  const cookie = await session("coordinator"), marker = `SYN I2 HTTP ${randomUUID()}`;
  const inputs = ["Zulu", "Alpha", "Alpha"].map((name) => ({ ...crmCreate(), title: `${marker} ${name}` }));
  for (const input of inputs) assert.equal((await call(cookie, "crm/opportunities", input)).status, 201);
  assert.equal((await call(cookie, `crm/opportunities/${inputs[1].id}/qualify`, crmQualify())).status, 200);
  const search = `q=${encodeURIComponent(marker)}&sort=Title&company_id=${CRM.company}&site_id=${CRM.site}&owner_id=${CRM.owner}&next_action=DueNeeded`;
  const all = await call(cookie, `crm/opportunities?${search}`);
  assert.equal(all.status, 200);
  assert.match(all.headers.get("cache-control")!, /no-store/);
  assert.equal(all.body.window.count_basis, "ReturnedPage");
  assert.deepEqual(all.body.stages.map((s: { count: number }) => s.count), [2, 1]);
  const first = await call(cookie, `crm/opportunities?${search}&limit=2`);
  const last = await call(cookie, `crm/opportunities?${search}&limit=2&cursor=${encodeURIComponent(first.body.next_cursor)}`);
  assert.equal(last.status, 200);
  assert.equal(last.body.completeness, "Partial");
  assert.equal(last.body.window.has_more, false);
  assert.deepEqual([...first.body.items, ...last.body.items], all.body.items);
  for (const item of all.body.items) assert.equal((await call(cookie, `crm/opportunities/${item.id}`)).body.items[0].id, item.id);
  assert.equal((await call(cookie, `crm/opportunities?${search}&stage_id=Qualified`)).body.items[0].id, inputs[1].id);
  assert.equal((await call(cookie, `crm/opportunities?${search}&limit=2&cursor=${encodeURIComponent(first.body.next_cursor)}&stage_id=Qualified`)).status, 422);
  for (const suffix of ["&view=Board", "&sort=Money", "&pipeline_id=preview"]) assert.equal((await call(cookie, `crm/opportunities?${search}${suffix}`)).status, 422);
  const patch = await fetch(`${origin}/api/v1/crm/opportunities/${inputs[0].id}`, { method: "PATCH", headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ stage_id: "Qualified" }) });
  assert.equal(patch.status, 405);
  assert.equal((await call(cookie, `crm/opportunities/${inputs[0].id}`)).body.items[0].stage_id, "Enquiry");
});

test("CA-06/10 I2 HTTP actual grant revocation between list/detail/selectors/counts and original receipt", async () => {
  const user = randomUUID(), token = randomBytes(32).toString("hex");
  await database().query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN I2 HTTP scoped actor')", [user, CRM.workspace, randomUUID()]);
  await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2", [user, CRM.owner]);
  await database().query("INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')", [createHash("sha256").update(token).digest("hex"), CRM.workspace, user]);
  const cookie = `ppo_local_session=${token}`, input = { ...crmCreate(), title: `SYN I2 HTTP private ${randomUUID()}`, owner_id: user, initial_action: crmAction(user) };
  assert.equal((await call(cookie, "crm/opportunities", input)).status, 201);
  assert.equal((await call(cookie, `crm/opportunities?q=${encodeURIComponent(input.title)}`)).body.items[0].id, input.id);
  assert.ok((await call(cookie, "crm/worklist-options?kind=Owner")).body.items.some((o: { id: string }) => o.id === user));
  const other = await session("second-company");
  const hidden = await call(other, `crm/opportunities/${input.id}`), missing = await call(other, `crm/opportunities/${randomUUID()}`);
  assert.equal(hidden.status, missing.status); assert.equal(hidden.body.code, missing.body.code);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'", [user]);
  for (const path of [`crm/opportunities?q=${encodeURIComponent(input.title)}`, `crm/opportunities/${input.id}`, `activities/${input.initial_action.id}`, `operations/${input.operation_id}`, ...["Company", "Site", "Owner"].map((kind) => `crm/worklist-options?kind=${kind}`)]) {
    const r = await call(cookie, path);
    assert.ok([403, 404].includes(r.status));
    assert.ok(!JSON.stringify(r.body).includes(input.title));
    assert.equal(r.body.stages, undefined, "Denial must not masquerade as zero stage counts");
    assert.match(r.headers.get("cache-control")!, /no-store/);
  }
  assert.equal((await call(cookie, "crm/opportunities", input)).status, 404);
});
