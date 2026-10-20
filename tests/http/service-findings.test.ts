import assert from "node:assert/strict";
import { test } from "node:test";
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
