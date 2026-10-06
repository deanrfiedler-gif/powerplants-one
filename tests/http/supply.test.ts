import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { supplyInput, supplyFact, supplyBase } from "../helpers/supply";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function login(profile = "coordinator") {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function request(cookie: string, path: string, data?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: { cookie, origin, "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return {
    status: r.status,
    cache: r.headers.get("cache-control"),
    data: await r.json(),
  };
}
test("Supply HTTP permissions, source states, replay/content conflict, stale writes and unknown recovery", async () => {
  const c = await login(),
    observer = await login("observer"),
    other = await login("second-company");
  const input = supplyInput("Demand", { completeness: "Partial" });
  let r = await request(c, "supply/records", input);
  assert.equal(r.status, 201);
  assert.match(r.cache ?? "", /no-store/);
  const original = r.data;
  assert.equal((await request(c, "supply/records", input)).status, 200);
  assert.equal(
    (
      await request(c, "supply/records", {
        ...input,
        title: "Different content",
      })
    ).data.code,
    "OperationConflict",
  );
  assert.deepEqual(
    (await request(c, `supply/operations/${input.operation_id}`)).data,
    original,
  );
  assert.equal(
    (await request(other, `supply/records/${input.id}`)).status,
    404,
  );
  assert.equal(
    (await request(observer, "supply/records", supplyInput())).status,
    404,
  );
  r = await request(observer, `supply/records/${input.id}`);
  assert.equal(r.status, 200);
  assert.equal(r.data.capabilities.edit, false);
  assert.equal(r.data.basis.readiness.state, "Evidence needed");
  assert.equal(r.data.basis.readiness.shortage, null);
  assert.equal(
    (await request(c, "supply/records", { ...supplyInput(), quantity: 3 }))
      .status,
    422,
  );
  assert.equal(
    (await request(c, `supply/records/${randomUUID()}`, input)).status,
    422,
  );
  const cmd = supplyFact("Promise", 1, { quantity: "4" });
  r = await request(c, `supply/records/${input.id}/facts`, cmd);
  assert.equal(r.status, 201);
  assert.equal(
    (await request(c, `supply/records/${input.id}/facts`, cmd)).status,
    200,
  );
  assert.equal(
    (
      await request(c, `supply/records/${input.id}/facts`, {
        ...cmd,
        operation_id: randomUUID(),
      })
    ).data.code,
    "VersionConflict",
  );
  assert.equal(
    (await request(c, `supply/records/${input.id}/reservation`, supplyBase()))
      .data.code,
    "NotConfigured",
  );
  const w = (await request(c, `supply/records/${input.id}`)).data;
  const unknown = supplyFact("ExternalOutcome", w.record.version, {
    source_operation: "SYN-HTTP-ORIGINAL",
    effect: "Transfer",
    state: "Unknown",
  });
  assert.equal(
    (await request(c, `supply/records/${input.id}/facts`, unknown)).status,
    201,
  );
  const current = (await request(c, `supply/records/${input.id}`)).data;
  const reconciliation = {
    ...supplyFact("ExternalOutcome", current.record.version, {
      source_operation: "SYN-HTTP-ORIGINAL",
      effect: "Transfer",
      state: "Confirmed",
    }),
    predecessor_id: unknown.id,
  };
  assert.equal(
    (await request(c, `supply/records/${input.id}/facts`, reconciliation))
      .status,
    201,
  );
  assert.equal(
    (await request(c, `supply/records/${input.id}/facts`, reconciliation))
      .status,
    200,
  );
  const list = (
    await request(other, `supply/records?kind=Demand&q=${input.reference}`)
  ).data;
  assert.equal(list.items.length, 0);
});
