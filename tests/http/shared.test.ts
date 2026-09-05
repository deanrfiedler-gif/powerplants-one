import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin = "http://127.0.0.1:3000";
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const response = await fetch(`${origin}/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      cookie,
      origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  return { status: response.status, body: await response.json() };
}
test("P02 HTTP envelopes, exact retry status, validation and field/relationship isolation", async () => {
  const coordinator = await session("coordinator"),
    observer = await session("site-observer"),
    systems = await session("systems");
  const customers = await call(coordinator, "customers?limit=1");
  assert.equal(customers.status, 200);
  assert.ok(customers.body.next_cursor);
  assert.ok(customers.body.observed_at);
  assert.equal(customers.body.source, "Synthetic");
  const current = await call(
    observer,
    "sites/70000000-0000-4000-8000-000000000001",
  );
  assert.equal(current.status, 200);
  assert.equal(current.body.items[0].assets.items.length, 2);
  assert.equal(
    (await call(observer, "sites/70000000-0000-4000-8000-000000000002")).status,
    404,
  );
  assert.equal((await call(systems, "customers")).status, 403);
  assert.equal(
    (
      await call(
        coordinator,
        "customers?company_id=20000000-0000-4000-8000-000000000002",
      )
    ).body.items.length,
    0,
  );
  const history = await call(
    observer,
    "assets/80000000-0000-4000-8000-000000000001/history",
  );
  assert.equal(history.body.items.length, 1);
  assert.ok(!JSON.stringify(history).includes("restricted finance"));
  assert.ok(!JSON.stringify(history).includes("Former Technician"));
  const body = {
    operation_id: randomUUID(),
    schema_version: 1,
    id: randomUUID(),
    company_id: "20000000-0000-4000-8000-000000000001",
    display_name: "SYN HTTP organisation",
    relationship_status: "Prospect",
    owner_id: "30000000-0000-4000-8000-000000000001",
    reason: "SYN HTTP verification",
  };
  const created = await call(coordinator, "customers", body);
  assert.equal(created.status, 201);
  assert.equal(created.body.record_version, 1);
  const replay = await call(coordinator, "customers", body);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, created.body);
  assert.equal(
    (
      await call(coordinator, "customers", {
        ...body,
        display_name: "SYN conflicting content",
      })
    ).status,
    409,
  );
  assert.equal(
    (await call(coordinator, "customers", { ...body, actor_id: body.owner_id }))
      .status,
    422,
  );
  assert.equal(
    (
      await call(observer, "customers", {
        ...body,
        operation_id: randomUUID(),
        id: randomUUID(),
      })
    ).status,
    403,
  );
  const stored = await call(coordinator, `customers/${body.id}`);
  assert.match(stored.body.items[0].display_number, /^SYN-PPO-ORG-\d{6,}$/);
  const update = {
    operation_id: randomUUID(),
    schema_version: 1,
    expected_version: 1,
    display_name: "SYN renamed over HTTP",
    parent_organisation_id: null,
    reason: "SYN change",
  };
  assert.equal(
    (await call(coordinator, `customers/${body.id}/revise-identity`, update))
      .status,
    200,
  );
  assert.equal(
    (
      await call(coordinator, `customers/${body.id}/revise-identity`, {
        ...update,
        operation_id: randomUUID(),
      })
    ).status,
    409,
  );
});
