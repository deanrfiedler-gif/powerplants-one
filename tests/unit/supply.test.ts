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
import { materialBasis } from "../../src/supply/reads";
import type { QueryClient } from "../../src/platform/permissions";
import type { Principal } from "../../src/platform/identity";
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
const promise = (
  data: Record<string, string>,
  completeness: Fact["completeness"] = "Complete",
) =>
  ({
    ...supplyFact("Promise", 2, data),
    record_id: "d",
    version: 2,
    activity_id: null,
    completeness,
  }) as Fact;
test("readiness follows the SUP-1 state table: class, evidence, usable allocation, then promise timing", () => {
  // The demand needs 10 EA by 2026-10-01.
  const d = demand(),
    forecast = { ...d, data: { ...d.data, demand_class: "Forecast" } },
    onTime = promise({ quantity: "10", promised_on: "2026-09-30" }),
    sameDay = promise({ quantity: "5", promised_on: "2026-10-01" }),
    late = promise({ quantity: "10", promised_on: "2026-10-02" }),
    tooSmall = promise({ quantity: "4", promised_on: "2026-09-30" }),
    partial = promise({ quantity: "10", promised_on: "2026-09-30" }, "Partial");
  // [case, demand, usable allocated, sources complete, facts, state, shortage]
  // prettier-ignore
  const table: [string, SupplyRecord, string, boolean, Fact[], string, string | null][] = [
    ["forecast, complete", forecast, "4", true, [], "Not assessed", "6"],
    ["forecast, nothing allocated", forecast, "0", true, [], "Not assessed", "10"],
    ["forecast, incomplete source", forecast, "0", false, [], "Not assessed", null],
    ["forecast, partial demand", { ...forecast, completeness: "Partial" }, "0", true, [], "Not assessed", null],
    ["approved, partial demand", { ...d, completeness: "Partial" }, "10", true, [onTime], "Evidence needed", null],
    ["approved, no required date", { ...d, data: { ...d.data, required_on: null } }, "10", true, [], "Evidence needed", null],
    ["approved, incomplete source", d, "10", false, [onTime], "Evidence needed", null],
    ["approved, covered", d, "10", true, [], "Ready for the stated material scope", "0"],
    ["approved, covered with late promise", d, "10", true, [late], "Ready for the stated material scope", "0"],
    ["approved, short, on-time promise", d, "5", true, [onTime], "At risk", "5"],
    ["approved, short, promise on the required date", d, "5", true, [sameDay], "At risk", "5"],
    ["approved, nothing allocated, on-time promise", d, "0", true, [onTime], "At risk", "10"],
    ["approved, short, no promise", d, "5", true, [], "Blocked", "5"],
    ["approved, nothing allocated, no promise", d, "0", true, [], "Blocked", "10"],
    ["approved, short, late promise", d, "5", true, [late], "Blocked", "5"],
    ["approved, short, promise smaller than shortage", d, "5", true, [tooSmall], "Blocked", "5"],
    ["approved, short, partial promise evidence", d, "5", true, [partial], "Blocked", "5"],
  ];
  for (const [name, r, allocated, complete, facts, state, shortage] of table)
    assert.deepEqual(
      readiness(r, allocated, complete, facts),
      { state, shortage },
      name,
    );
  // Only the current promise counts: a late revision replaces an on-time one, and the reverse.
  const revised = {
    ...late,
    id: "late",
    version: 3,
    predecessor_id: onTime.id,
  };
  assert.equal(readiness(d, "5", true, [onTime, revised]).state, "Blocked");
  const restored = {
    ...onTime,
    id: "back",
    version: 4,
    predecessor_id: "late",
  };
  assert.equal(
    readiness(d, "5", true, [onTime, revised, restored]).state,
    "At risk",
  );
});
test("material basis treats an empty allocation register as a known shortage, not missing evidence", async () => {
  const queries: string[] = [];
  const c = {
    query: async (sql: string) => {
      queries.push(sql);
      return { rows: [], rowCount: 0 };
    },
  } as unknown as QueryClient;
  const p = { workspace_id: "w" } as Principal,
    d = demand(),
    onTime = promise({ quantity: "10", promised_on: "2026-09-30" });
  const basis = (r: SupplyRecord, facts: Fact[]) =>
    materialBasis(c, p, r, facts);
  assert.deepEqual((await basis(d, [])).readiness, {
    state: "Blocked",
    shortage: "10",
  });
  assert.deepEqual((await basis(d, [onTime])).readiness, {
    state: "At risk",
    shortage: "10",
  });
  assert.deepEqual(
    (await basis({ ...d, data: { ...d.data, demand_class: "Forecast" } }, []))
      .readiness,
    { state: "Not assessed", shortage: "10" },
  );
  assert.equal((await basis(d, [])).usable, "0");
  assert.ok(queries.every((s) => s.includes("ppo.supply_allocations")));
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
