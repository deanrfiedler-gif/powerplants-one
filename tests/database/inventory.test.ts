import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { saveRecord, allocate } from "../../src/supply/commands";
import { inventory } from "../../src/supply/inventory";
import { supplyInput, supplyBase } from "../helpers/supply";
import { CRM } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("Per-item Inventory reads across observations, with scoped history and truthful limits", async () => {
  const p = (await createSession("coordinator")).principal;
  const item = `SYN-INV-${randomUUID()}`;
  const a = supplyInput("Supply", { item });
  await saveRecord(p, a);
  const b = supplyInput("Supply", {
    item,
    title: `SYN combined observation ${item}`,
    observed_at: "2026-09-25T00:00:00.000Z",
    data: {
      ...a.data,
      warehouse: "SYN second location",
      available: null,
      held: "0",
    },
    completeness: "Partial",
  });
  await saveRecord(p, b);
  const demand = supplyInput("Demand", { item });
  await saveRecord(p, demand);
  const incoming = supplyInput("Supply", {
    item,
    data: { ...a.data, supply_kind: "Shipment", shipment_id: randomUUID() },
  });
  await saveRecord(p, incoming);
  await allocate(p, {
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
  });
  const read = await inventory(p, { record: a.id });
  assert.ok(read.selected);
  assert.equal(read.selected.observations.length, 2);
  assert.equal(read.selected.quantities.on_hand, "20");
  assert.equal(read.selected.quantities.available, null);
  assert.equal(read.selected.quantities.held, "0");
  assert.equal(read.selected.product_link, null);
  const searched = await inventory(p, { q: b.title });
  assert.equal(searched.items[0].observations.length, 2);
  assert.equal(searched.items[0].quantities.on_hand, "20");
  assert.equal(read.activity.length, 4);
  assert.equal(read.allocations.length, 1);
  assert.equal(read.allocations[0].supply_id, incoming.id);
  assert.equal(read.allocations[0].basis, "Incoming");
  assert.equal(read.limit, 100);
  const observer = (await createSession("observer")).principal;
  assert.equal((await inventory(observer, { record: a.id })).can_record, false);
  const other = (await createSession("second-company")).principal;
  await assert.rejects(
    inventory(other, { record: a.id }),
    (e) => (e as { status: number }).status === 404,
  );
  assert.ok(
    !(await inventory(other)).items.some((r) => r.company_id === CRM.company),
  );
  const systems = (await createSession("systems")).principal;
  await assert.rejects(inventory(systems), (e) =>
    [403, 404].includes((e as { status: number }).status),
  );
  // A real permission revocation must remove formerly visible rows, not retain cached data.
  const removed = await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='supply.read' RETURNING *",
    [p.workspace_id, observer.actor_id],
  );
  try {
    await assert.rejects(inventory(observer, { record: a.id }));
  } finally {
    await database().query(
      "INSERT INTO ppo.permission_grants SELECT * FROM json_populate_recordset(NULL::ppo.permission_grants,$1::json)",
      [JSON.stringify(removed.rows)],
    );
  }
});
test("Inventory item limit bounds actual grouped results", async () => {
  const p = (await createSession("coordinator")).principal;
  for (let n = 0; n < 101; n++)
    await saveRecord(
      p,
      supplyInput("Supply", {
        item: `SYN-LIMIT-${n}`,
        title: `SYN Inventory limit ${n}`,
      }),
    );
  const read = await inventory(p, { q: "SYN Inventory limit" });
  assert.equal(read.items.length, 100);
  assert.equal(read.limit, 100);
  assert.equal(read.bounded, true);
});
