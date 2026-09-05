import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
const origin = "http://127.0.0.1:3000",
  wo = "90000000-0000-4000-8000-000000000003";
async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      ...(body ? { Origin: origin, "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const content = await r.text();
  return {
    status: r.status,
    headers: r.headers,
    body: r.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(content)
      : content,
  };
}
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN HTTP P04 component verification",
});
test("P04 HTTP routes expose safe scoped work-order detail, stage blockers and immutable operation replay", async () => {
  const cookie = await session("coordinator");
  const detail = await call(cookie, `service/work-orders/${wo}`);
  assert.equal(detail.status, 200);
  assert.match(detail.headers.get("cache-control")!, /private, no-store/);
  const w = detail.body.items[0],
    s = w.scopes[0];
  assert.ok(
    w.blockers.some((b: { field: string }) => b.field === "authority_evidence"),
  );
  const refusal = await call(cookie, `service/work-orders/${wo}/authorise`, {
    ...base(),
    expected_version: w.version,
    scope_revision_id: s.id,
    scope_version: s.version,
    policy_version_id: s.policy_version_id,
  });
  assert.equal(refusal.status, 422);
  assert.equal(refusal.body.code, "AuthorisationBlocked");
  const cmd = {
    ...base(),
    id: randomUUID(),
    company_id: w.company_id,
    site_id: w.site_id,
    customer_id: w.customer_id,
    service_owner_id: "30000000-0000-4000-8000-000000000001",
    tickets: [
      {
        ticket_id: w.tickets[0].id,
        issue_disposition: "SYN HTTP explicit source link",
      },
    ],
  };
  const a = await call(cookie, "service/work-orders", cmd);
  assert.equal(a.status, 201);
  assert.equal(a.body.state, "Draft");
  const b = await call(cookie, "service/work-orders", cmd);
  assert.equal(b.status, 200);
  assert.deepEqual(a.body, b.body);
  assert.deepEqual(
    (await call(cookie, `operations/${cmd.operation_id}`)).body,
    a.body,
  );
  assert.equal(
    (
      await call(cookie, "service/work-orders", {
        ...cmd,
        reason: "Changed payload",
      })
    ).status,
    409,
  );
  assert.ok(!JSON.stringify(detail.body).includes("erp_company_id"));
  assert.ok(!JSON.stringify(detail.body).includes("erp_connection_id"));
});
test("P04 HTTP rejects spoofed authority, unknown routes and inaccessible direct IDs/lists/selectors", async () => {
  const systems = await session("systems"),
    other = await session("second-company"),
    observer = await session("site-observer"),
    coordinator = await session("coordinator");
  assert.equal((await call(systems, "service/work-orders")).status, 403);
  assert.equal((await call(other, `service/work-orders/${wo}`)).status, 404);
  assert.equal(
    (await call(other, `service/work-orders/${randomUUID()}`)).status,
    404,
  );
  assert.equal(
    (
      await call(observer, `service/work-orders/${wo}/authorise`, {
        ...base(),
        expected_version: 1,
        scope_revision_id: "91000000-0000-4000-8000-000000000003",
        scope_version: 1,
        policy_version_id: "94000000-0000-4000-8000-000000000001",
      })
    ).status,
    403,
  );
  assert.equal(
    (await call(coordinator, "service/work-orders?actor_id=spoof")).status,
    422,
  );
  assert.equal(
    (
      await call(coordinator, `service/work-orders/${wo}/authorise`, {
        ...base(),
        actor_id: "spoof",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await call(coordinator, `service/work-orders/${wo}/confirm`, {
        ...base(),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        other,
        "selectors/owners?company_id=20000000-0000-4000-8000-000000000001&site_id=70000000-0000-4000-8000-000000000001&purpose=WorkOrder",
      )
    ).status,
    404,
  );
});
