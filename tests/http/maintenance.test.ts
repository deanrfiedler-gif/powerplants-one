import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN native Maintenance HTTP proof",
});
const context = {
  company_id: "20000000-0000-4000-8000-000000000001",
  site_id: "70000000-0000-4000-8000-000000000001",
  customer_id: "50000000-0000-4000-8000-000000000001",
  asset_id: "80000000-0000-4000-8000-000000000001",
  owner_id: "30000000-0000-4000-8000-000000000001",
};
async function login(profile = "coordinator") {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(
  cookie: string,
  path: string,
  body?: unknown,
  from = origin,
) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { cookie, origin: from, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: r.status,
    cache: r.headers.get("cache-control"),
    body: r.headers.get("content-type")?.includes("application/json")
      ? await r.json()
      : await r.text(),
  };
}
test("MA HTTP native routes, current authority, exact receipts and optimistic competing updates", async () => {
  const actor = await login(),
    other = await login("other-workspace"),
    observer = await login("observer"),
    id = randomUUID();
  for (const path of [
    "maintenance/agreements",
    "maintenance/coverage",
    "maintenance/plans",
    "maintenance/due",
    "maintenance/renewals",
    "warranty/cases",
    "warranty/supplier-recovery",
    "maintenance/options",
  ]) {
    const r = await call(actor, path);
    assert.equal(r.status, 200, path);
    assert.match(r.cache ?? "", /no-store/);
  }
  const cmd = {
    ...base(),
    id,
    ...context,
    event_date: "2026-09-01",
    symptoms: "SYN HTTP exact evidence",
    source: {
      reference: "SYN-HTTP-WARRANTY",
      revision: "1",
      availability: "Unknown",
      source_date: null,
      content: "Terms not established",
      access_class: "RestrictedService",
    },
    next_review: "2026-10-01",
    next_action: "Obtain exact source",
  };
  assert.equal((await call(observer, "warranty/cases", cmd)).status, 404);
  assert.equal(
    (await call(actor, "warranty/cases", cmd, "https://invalid.example"))
      .status,
    403,
  );
  const first = await call(actor, "warranty/cases", cmd);
  assert.equal(first.status, 201);
  assert.deepEqual((await call(actor, "warranty/cases", cmd)).body, first.body);
  assert.equal(
    (
      await call(actor, "warranty/cases", {
        ...cmd,
        symptoms: "Changed content",
      })
    ).status,
    409,
  );
  assert.deepEqual(
    (await call(actor, `operations/${cmd.operation_id}`)).body,
    first.body,
  );
  assert.equal((await call(other, `warranty/cases/${id}`)).status, 404);
  const writes = await Promise.all(
    [1, 2].map((n) =>
      call(actor, `warranty/cases/${id}`, {
        ...base(),
        expected_version: 1,
        action: "AssignReview",
        data: {
          owner_id: context.owner_id,
          due_date: "2026-10-15",
          next_action: `SYN competing decision ${n}`,
        },
      }),
    ),
  );
  assert.deepEqual(writes.map((x) => x.status).sort(), [201, 409]);
  const detail = await call(actor, `warranty/cases/${id}`);
  assert.equal(detail.body.row.version, 2);
  assert.equal(detail.body.history.length, 2);
  assert.equal(
    (
      await call(actor, `warranty/cases/${id}`, {
        ...base(),
        expected_version: 2,
        action: "Plan",
        data: {},
      })
    ).status,
    422,
  );
});
