import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decimal,
  quantity,
  readiness,
  receiptArithmetic,
  custodyArithmetic,
  currentFacts,
  remainingReturn,
  fulfilment,
  materialChanges,
  reservationPolicy,
  type Fact,
  type SupplyRecord,
} from "../../src/supply/model";
import { recordCommand, factCommand } from "../../src/supply/validation";
import { supplyInput, supplyFact } from "../helpers/supply";
const demand = () => supplyInput() as unknown as SupplyRecord;
test("exact decimal algebra conserves millionths and refuses implicit numeric coercion", () => {
  assert.equal(quantity(decimal("0.1") + decimal("0.2")), "0.3");
  assert.equal(quantity(decimal("999999999999.999999")), "999999999999.999999");
  for (const v of ["-1", "1e3", "0.0000001", "NaN", " 1", "01"])
    assert.throws(() => decimal(v));
  assert.throws(() => recordCommand(supplyInput("Demand", { quantity: 1 })));
  assert.throws(() => recordCommand(supplyInput("Demand", { unit: "" })));
});
test("readiness is bound to approved demand, complete evidence and exact usable quantity", () => {
  const d = demand();
  assert.equal(
    readiness(d, "10", true, []).state,
    "Ready for the stated material scope",
  );
  assert.deepEqual(readiness(d, "5", true, []), {
    state: "Blocked",
    shortage: "5",
  });
  assert.deepEqual(
    readiness({ ...d, completeness: "Partial" }, "10", true, []),
    { state: "Evidence needed", shortage: null },
  );
  assert.equal(readiness(d, "10", false, []).state, "Evidence needed");
  assert.equal(
    readiness(
      { ...d, data: { ...d.data, demand_class: "Forecast" } },
      "10",
      true,
      [],
    ).state,
    "Not assessed",
  );
  assert.equal(
    readiness({ ...d, data: { ...d.data, required_on: null } }, "10", true, [])
      .state,
    "Evidence needed",
  );
});
test("receipt inspection partitions damaged, quarantined and usable quantities", () => {
  receiptArithmetic({
    received: "8",
    inspected: "8",
    usable: "5",
    quarantined: "3",
    damaged: "2",
  });
  assert.throws(() =>
    receiptArithmetic({
      received: "8",
      inspected: "8",
      usable: "6",
      quarantined: "3",
      damaged: "2",
    }),
  );
  assert.throws(() =>
    receiptArithmetic({
      received: "8",
      inspected: "9",
      usable: "5",
      quarantined: "3",
      damaged: "2",
    }),
  );
  assert.throws(() =>
    receiptArithmetic({
      received: "8",
      inspected: "8",
      usable: "5",
      quarantined: "3",
      damaged: "4",
    }),
  );
});
test("corrections retain original delivery while outstanding uses current exact captures", () => {
  const original = {
    ...supplyFact("Delivery", 2, { quantity: "4" }),
    record_id: "d",
    version: 2,
    activity_id: null,
  } as Fact;
  const next = {
    ...supplyFact("Delivery", 3, { quantity: "3" }),
    record_id: "d",
    version: 3,
    activity_id: null,
    predecessor_id: original.id,
  } as Fact;
  assert.equal(currentFacts([original, next]).length, 1);
  assert.equal(fulfilment([original, next], "10").outstanding, "7");
  assert.equal(original.data.quantity, "4");
});
test("remaining returns never exceed original entitlement", () => {
  assert.equal(remainingReturn("3.5", "2.25"), "1.25");
  assert.throws(() => remainingReturn("3", "3.000001"));
});
test("custody is separate from consumption and closes only with reconciled outcomes", () => {
  const data = {
    held: "0",
    at_job: "0",
    used: "6",
    returned: "3",
    damaged: "1",
    quarantined: "0",
    missing: "0",
    state: "Closed",
    inventory_reference: "SYN exact issue and return",
    inventory_observed_at: "2026-09-24T00:00:00Z",
  };
  custodyArithmetic("10", data);
  assert.throws(() => custodyArithmetic("10", { ...data, returned: "4" }));
  assert.throws(() =>
    custodyArithmetic("10", { ...data, returned: "2", missing: "1" }),
  );
  assert.throws(() =>
    custodyArithmetic("10", { ...data, inventory_reference: null }),
  );
});
test("material changes compare explicit before and after fields", () => {
  const d = demand();
  assert.deepEqual(
    materialChanges(d, {
      ...d,
      quantity: "12",
      data: { ...d.data, required_on: "2026-10-04" },
    }),
    ["quantity", "required_on"],
  );
  assert.deepEqual(materialChanges(d, { ...d, title: "Renamed" }), []);
});
test("unsupported reservation commands and invented field/state contracts remain blocked", () => {
  assert.equal(reservationPolicy.state, "Not configured");
  assert.throws(() =>
    factCommand({ ...supplyFact("Reservation", 1), data: { state: "Posted" } }),
  );
  assert.throws(() =>
    recordCommand({ ...supplyInput(), erp_endpoint: "invented" }),
  );
});
