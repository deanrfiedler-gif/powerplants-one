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
const root = "/api/v1/service/escalations";
async function request(
  path: string,
  cookie?: string,
  body?: unknown,
  requestOrigin = origin,
) {
  return fetch(origin + root + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      Origin: requestOrigin,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
test("SV08 HTTP authenticates every read, validates filters and commands and rejects origin/access bypass", async () => {
  assert.equal((await request("")).status, 401);
  const cookie = await session("coordinator"),
    observer = await session("observer");
  const register = await request("?view=open&limit=1", cookie);
  assert.equal(register.status, 200);
  assert.match(register.headers.get("cache-control")!, /private, no-store/);
  const rows = await register.json();
  assert.equal(rows.synthetic, true);
  assert.ok(rows.items.length <= 1);
  assert.ok(["Complete", "BoundedWindow"].includes(rows.completeness));
  for (const query of [
    "view=other",
    "limit=51",
    "offset=-1",
    "owner_id=bad",
    "actor_id=other",
  ])
    assert.equal((await request("?" + query, cookie)).status, 422);
  assert.equal((await request("", observer)).status, 403);
  assert.equal(
    (await request("/options?finding_key=not-a-finding", cookie)).status,
    422,
  );
  assert.equal((await request("/" + randomUUID(), cookie)).status, 404);
  assert.equal((await request("", cookie, {})).status, 422);
  assert.equal(
    (await request("", cookie, {}, "https://elsewhere.invalid")).status,
    403,
  );
  assert.equal(
    (
      await request("/" + randomUUID() + "/commands", cookie, {
        operation_id: randomUUID(),
        schema_version: 1,
        reason: "SYN invalid action",
        expected_version: 1,
        action: "send_email",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await request(
        "/" +
          randomUUID() +
          "/files?kind=pack&file_id=" +
          randomUUID() +
          "&format=pdf",
        observer,
      )
    ).status,
    403,
  );
});
