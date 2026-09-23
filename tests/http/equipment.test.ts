import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN Equipment HTTP verification",
});
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
test("EQ HTTP exact source, current permission, original receipts and stale writers", async () => {
  const p = await login(),
    other = await login("other-workspace"),
    id = randomUUID();
  assert.equal(
    (
      await call(p, "assets", {
        ...base(),
        id,
        company_id: company,
        site_id: site,
        description: "SYN HTTP Equipment",
        identity_status: "Unresolved",
        effective_at: "2026-09-01T00:00:00.000Z",
        configuration: "SYN H1 / F1",
      })
    ).status,
    201,
  );
  const read = await call(p, `equipment/${id}`);
  assert.equal(read.status, 200);
  assert.match(read.cache ?? "", /no-store/);
  assert.equal((await call(other, `equipment/${id}`)).status, 404);
  assert.equal(
    (await call(other, `equipment/lookup?q=${id}`)).body.outcome,
    "UnknownOrInaccessible",
  );
  const preview = await call(p, `equipment/${id}/impact`),
    change = randomUUID(),
    proposal = {
      ...base(),
      id: change,
      expected_version: 1,
      kind: "Configuration",
      effective_at: "2026-09-20T00:00:00.000Z",
      source_reference: "SYN HTTP source",
      source_revision: "r01",
      basis_hash: preview.body.basis_hash,
      configuration: "SYN H1 / F2",
      consequences:
        "Retain historical Service, documents, warranty and configuration evidence.",
    };
  const first = await call(p, `equipment/${id}/changes`, proposal);
  assert.equal(first.status, 201, JSON.stringify(first.body));
  assert.deepEqual(
    (await call(p, `equipment/${id}/changes`, proposal)).body,
    first.body,
  );
  assert.deepEqual(
    (await call(p, `operations/${proposal.operation_id}`)).body,
    first.body,
  );
  assert.equal(
    (await call(other, `operations/${proposal.operation_id}`)).status,
    404,
  );
  assert.equal(
    (
      await call(p, `equipment/${id}/changes`, {
        ...proposal,
        configuration: "Changed original",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(
        p,
        `equipment/${id}/changes`,
        proposal,
        "https://unrelated.invalid",
      )
    ).status,
    403,
  );
  const apply = { ...base(), expected_version: 1, decision: "Apply" };
  const results = await Promise.all([
    call(p, `equipment/changes/${change}/review`, apply),
    call(p, `equipment/changes/${change}/review`, apply),
  ]);
  assert.deepEqual(results[0].body, results[1].body);
  assert.ok(results.every((r) => [200, 201].includes(r.status)));
  const after = await call(p, `equipment/${id}`);
  assert.equal(after.body.context.version, 2);
  assert.equal(
    after.body.asset.configurations.filter(
      (c: { is_current: boolean }) => c.is_current,
    ).length,
    1,
  );
  assert.equal(
    (
      await call(p, `equipment/${id}/changes`, {
        ...proposal,
        ...base(),
        id: randomUUID(),
      })
    ).status,
    409,
  );
  const timeline = await call(p, `equipment/${id}/timeline`);
  assert.equal(timeline.status, 200);
  assert.ok(
    timeline.body.items.some(
      (e: { source: string }) => e.source === "Equipment change",
    ),
  );
  assert.ok(
    (await call(p, "reviews?view=history&module=Equipment")).body.items.some(
      (e: { record_id: string }) => e.record_id === change,
    ),
  );
  assert.equal((await call(p, "equipment/commissioning-backups")).status, 200);
});
