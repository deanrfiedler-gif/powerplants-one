import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { crmDiscovery } from "../helpers/crm";
const origin =
  process.env.PPO_TEST_ORIGIN ??
  `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
test("CR-04 HTTP follow-through is private, strict, source-versioned and indistinguishable for hidden/missing deals", async () => {
  const login = await call("", "local-session", { profile: "coordinator" });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")!.split(";")[0],
    o = crmDiscovery();
  assert.equal((await call(cookie, "crm/opportunities", o)).status, 201);
  const path = `crm/opportunities/${o.id}/follow-through`,
    r = await call(cookie, path);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control")!, /no-store/);
  assert.equal(r.body.opportunity_version, 1);
  assert.equal(r.body.advisory.authority, "AdvisoryOnly");
  assert.equal((await call(cookie, path + "?invented=1")).status, 422);
  assert.equal((await call("", path)).status, 401);
  const other = await call("", "local-session", { profile: "second-company" }),
    otherCookie = other.headers.get("set-cookie")!.split(";")[0];
  const hidden = await call(otherCookie, path),
    missing = await call(
      otherCookie,
      `crm/opportunities/${randomUUID()}/follow-through`,
    );
  assert.equal(hidden.status, 404);
  assert.equal(hidden.body.code, missing.body.code);
  assert.ok(!JSON.stringify(hidden.body).includes(o.title));
});
