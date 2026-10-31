import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function get(cookie: string, path: string) {
  const r = await fetch(origin + "/api/v1/service/findings" + path, {
    headers: { Cookie: cookie },
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
test("SV07 HTTP uses authenticated no-store reads and strict query validation", async () => {
  const cookie = await session("coordinator");
  const all = await get(cookie, "?view=all&limit=1");
  assert.equal(all.status, 200);
  assert.match(all.headers.get("cache-control")!, /private, no-store/);
  assert.equal(all.body.count_scope, "AuthorisedCandidateWindow");
  assert.ok(all.body.items.length <= 1);
  for (const view of ["open", "needs_owner", "due_this_week", "overdue", "waiting_review", "follow_up_completed", "recurring", "closed"]) {
    const response = await get(cookie, `?view=${view}&limit=1`);
    assert.equal(response.status, 200);
    assert.equal(response.body.count_scope, "AuthorisedCandidateWindow");
    assert.equal(response.body.view, view);
    assert.equal(typeof response.body.counts[view], "number");
  }

  for (const q of [
    "limit=51",
    "source=private",
    "view=unknown",
    "owner_id=bad",
    "q=%00",
    "actor_id=anything",
  ])
    assert.equal((await get(cookie, "?" + q)).status, 422);
  assert.equal(
    (await get(cookie, "/schedule:90000000-0000-4000-8000-000000000099"))
      .status,
    404,
  );
  assert.equal((await get(cookie, "/not-a-finding")).status, 422);
  const privateActor = await session("other-workspace");
  const isolated = await get(privateActor, "?view=all");
  assert.ok([200, 403].includes(isolated.status));
  if (isolated.status === 200) assert.equal(isolated.body.total, 0);
  assert.equal((await fetch(origin + "/api/v1/service/findings")).status, 401);
  assert.equal(
    (
      await fetch(origin + "/api/v1/service/findings", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: "{}",
      })
    ).status,
    405,
  );
});

test("SV07 next-action HTTP keeps authentication, origin and strict source-bound validation", async () => {
  const cookie = await session("coordinator");
  const path = "/schedule:90000000-0000-4000-8000-000000000099/next-action";
  assert.equal((await get(cookie,path)).status,404);
  assert.equal((await get(cookie,path+"?actor_id=other")).status,422);
  const payload = {operation_id:randomUUID(),schema_version:1,reason:"SYN follow-up",source_token:"a".repeat(64),expected_version:0,owner_id:randomUUID(),due_at:"2031-11-10T00:00:00Z",instruction:"SYN investigate",required_evidence:null};
  async function post(body: unknown, token = cookie, requestOrigin = origin) {
    return fetch(origin+"/api/v1/service/findings"+path,{method:"POST",headers:{Cookie:token,Origin:requestOrigin,"Content-Type":"application/json"},body:JSON.stringify(body)});
  }
  assert.equal((await post(payload,"")).status,401);
  assert.equal((await post(payload,cookie,"https://example.invalid")).status,403);
  assert.equal((await post({...payload,activity_id:randomUUID()})).status,422);
  assert.equal((await post(payload)).status,404);
});
