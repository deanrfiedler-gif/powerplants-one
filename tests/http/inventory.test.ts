import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { supplyInput, supplyBase } from "../helpers/supply";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function login(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function request(cookie: string, path: string, body?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: { cookie, origin, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    cache: r.headers.get("cache-control"),
    data: await r.json(),
  };
}
test("Inventory HTTP read requires supply.read and company scope; native observations retain their API", async () => {
  const cookie = await login("coordinator"),
    item = `SYN-HTTP-INV-${randomUUID()}`;
  const a = supplyInput("Supply", { item });
  assert.equal((await request(cookie, "supply/records", a)).status, 201);
  const b = supplyInput("Supply", {
    item,
    data: { ...a.data, warehouse: "SYN second", available: null },
  });
  assert.equal((await request(cookie, "supply/records", b)).status, 201);
  const demand = supplyInput("Demand", { item });
  const incoming = supplyInput("Supply", {
    item,
    data: { ...a.data, supply_kind: "Shipment", shipment_id: randomUUID() },
  });
  assert.equal((await request(cookie, "supply/records", demand)).status, 201);
  assert.equal((await request(cookie, "supply/records", incoming)).status, 201);
  assert.equal(
    (
      await request(cookie, "supply/allocations", {
        ...supplyBase(),
        id: randomUUID(),
        expected_version: null,
        demand_id: demand.id,
        supply_id: incoming.id,
        demand_version: 1,
        supply_version: 1,
        quantity: "2",
        unit: "EA",
        basis: "Incoming",
      })
    ).status,
    201,
  );
  const read = await request(
    cookie,
    `supply/records?view=inventory&record=${a.id}`,
  );
  assert.equal(read.status, 200);
  assert.match(read.cache ?? "", /no-store/);
  assert.equal(read.data.selected.quantities.available, null);
  assert.equal(read.data.selected.quantities.held, "0");
  assert.equal(read.data.selected.observations.length, 2);
  assert.equal(read.data.selected.product_link, null);
  assert.equal(read.data.allocations[0].supply_id, incoming.id);
  assert.equal(read.data.allocations[0].quantity, "2");
  assert.equal(read.data.activity.length, 4);
  assert.equal(
    (await request(cookie, `supply/records/${a.id}`)).data.record.id,
    a.id,
  );
  assert.equal(
    (
      await request(
        await login("second-company"),
        `supply/records?view=inventory&record=${a.id}`,
      )
    ).status,
    404,
  );
  assert.ok(
    [403, 404].includes(
      (await request(await login("systems"), "supply/records?view=inventory"))
        .status,
    ),
  );
  const list = await request(cookie, `supply/records?view=inventory&q=${item}`);
  assert.equal(list.data.items.length, 1);
  assert.equal(list.data.limit, 100);
});
