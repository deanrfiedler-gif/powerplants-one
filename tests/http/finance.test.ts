import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin = "http://127.0.0.1:3000";
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
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
test("P10 real HTTP Finance account source/receipt isolation, exact fields and no-store headers", async () => {
  const p = await session("finance"),
    options = await call(p, "finance/options");
  assert.equal(options.status, 200);
  const a = options.body.accounts[0],
    input = {
      schema_version: 1,
      operation_id: randomUUID(),
      reason: "F-02 original synthetic account extraction through HTTP.",
      expected_version: a.version,
      fixture: "F-02",
    };
  const created = await call(p, `finance/accounts/${a.id}/observe`, input);
  assert.equal(created.status, 201);
  assert.deepEqual(
    (await call(p, `finance/accounts/${a.id}/observe`, input)).body,
    created.body,
  );
  assert.deepEqual(
    (await call(p, `operations/${input.operation_id}`)).body,
    created.body,
  );
  const r = await call(
    p,
    `customers/${a.customer_id}/account-observations?account_id=${a.id}`,
  );
  assert.equal(r.body.account_balance, "600.00");
  assert.equal(r.body.current.unapplied_cash, "200.00");
  assert.match(r.headers.get("cache-control")!, /no-store/);
  for (const profile of [
    "coordinator",
    "systems",
    "assigned-technician",
    "other-workspace",
    "second-company",
  ]) {
    const cookie = await session(profile);
    for (const path of [
      "finance/handoffs",
      "finance/options",
      `finance/handoffs/${randomUUID()}`,
      `customers/${a.customer_id}/account-observations?account_id=${a.id}`,
      `finance/issues/${randomUUID()}/bytes?format=pdf`,
      `operations/${input.operation_id}`,
    ]) {
      const response = await call(cookie, path);
      assert.ok([403, 404].includes(response.status), path);
      assert.equal(JSON.stringify(response.body).includes("600.00"), false);
      assert.equal(
        JSON.stringify(response.body).includes(a.fixture_key),
        false,
      );
    }
  }
});
test("P10 real HTTP refuses repeated/unknown fields, forged financial outcomes and cross-context accounts", async () => {
  const p = await session("finance"),
    a = (await call(p, "finance/options")).body.accounts[0];
  for (const path of [
    "finance/options?role=Finance",
    "finance/handoffs?company_id=x",
    "finance/handoffs?after=a&after=b",
    `customers/${randomUUID()}/account-observations?account_id=${a.id}`,
    `customers/${a.customer_id}/account-observations?account_id=${a.id}&currency=USD`,
  ])
    assert.ok([404, 422].includes((await call(p, path)).status), path);
  for (const body of [
    { role: "Finance" },
    { outcome: "Processed" },
    { actor_id: randomUUID() },
    { schema_version: 99 },
  ])
    assert.equal(
      (
        await call(p, `finance/accounts/${a.id}/observe`, {
          schema_version: 1,
          operation_id: randomUUID(),
          reason: "SYN malformed account command denied.",
          expected_version: a.version,
          fixture: "F-01",
          ...body,
        })
      ).status,
      422,
    );
  assert.equal(
    (await call(p, `finance/accounts/${a.id}/observe?role=Finance`, {})).status,
    422,
  );
});
