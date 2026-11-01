import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inventoryItems,
  filterInventory,
  inventoryQuantityText,
  type InventoryObservation,
} from "../../src/supply/inventory-model";
import { supplyInput } from "../helpers/supply";
const observation = (
  extra: Partial<InventoryObservation> = {},
): InventoryObservation =>
  ({
    ...supplyInput("Supply"),
    version: 1,
    workspace_id: "synthetic",
    company_name: "Synthetic Company A",
    owner_name: "Synthetic coordinator",
    usable: "10",
    updated_at: "2026-10-13T00:00:00.000Z",
    ...extra,
  }) as InventoryObservation;
test("Inventory groups exact company/item/unit only and preserves Unknown against zero", () => {
  const a = observation();
  const b = observation({
    data: {
      ...a.data,
      warehouse: "Other warehouse",
      available: null,
      on_hand: "0",
    },
    usable: null,
  });
  const result = inventoryItems([a, b]);
  assert.equal(result.length, 1);
  assert.equal(result[0].quantities.on_hand, "10");
  assert.equal(result[0].quantities.available, null);
  assert.equal(result[0].quantities.reserved, "0");
  assert.equal(result[0].quantities.usable, null);
  assert.equal(inventoryQuantityText(null, "EA"), "Unknown");
  assert.equal(inventoryQuantityText("0", "EA"), "0 EA");
  assert.equal(result[0].product_link, null);
  assert.equal(
    inventoryItems([
      a,
      observation({ company_id: "different" }),
      observation({ unit: "m" }),
      observation({ item: "similar-name" }),
    ]).length,
    4,
  );
});
test("Overlapping observations never double count, unavailable source values stay Unknown", () => {
  const a = observation();
  const b = observation();
  const [item] = inventoryItems([a, b]);
  assert.equal(item.ambiguous_locations, true);
  assert.equal(item.completeness, "Partial");
  assert.equal(item.quantities.on_hand, null);
  assert.equal(item.observations.length, 2);
  assert.equal(
    inventoryItems([a, observation({ site_id: null })])[0].quantities.on_hand,
    null,
  );
  assert.equal(
    inventoryItems([a, observation({ data: { ...a.data, bin: null } })])[0]
      .quantities.on_hand,
    null,
  );
  assert.equal(
    inventoryItems([observation({ completeness: "Unavailable" })])[0].quantities
      .on_hand,
    null,
  );
  assert.equal(
    inventoryItems([
      observation({ data: { ...a.data, supply_kind: "Shipment" } }),
    ]).length,
    0,
  );
});
test("Filters operate over real permitted item projections; linked view invents nothing", () => {
  const a = observation({
    data: { ...observation().data, available: null, held: "2" },
    completeness: "Partial",
  });
  const items = inventoryItems([a]);
  assert.equal(filterInventory(items, { view: "linked" }).length, 0);
  assert.equal(filterInventory(items, { view: "unlinked" }).length, 1);
  assert.equal(filterInventory(items, { view: "unknown" }).length, 1);
  assert.equal(filterInventory(items, { view: "held" }).length, 1);
  assert.equal(filterInventory(items, { view: "partial" }).length, 1);
  assert.equal(filterInventory(items, { q: "no such item" }).length, 0);
  assert.equal(filterInventory(items, { unit: "m" }).length, 0);
});
