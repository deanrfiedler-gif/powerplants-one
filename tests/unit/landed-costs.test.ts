import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  allocateLanded,
  landedProposal,
} from "../../src/estimating/sources/landed";
import type { CostLine } from "../../src/estimating/math";
import { landedCharges } from "../helpers/landed-costs";
import { refreshProposal } from "../../src/estimating/sources/validation";
const ids = [1, 2, 3].map(
  (n) => "10000000-0000-4000-8000-" + String(n).padStart(12, "0"),
);
const lines = (): CostLine[] =>
  ids.map((id) => ({
    id,
    category: "Product",
    description: "Synthetic product",
    quantity: "1.000",
    unit: "each",
    unit_cost: "1.00",
    unit_sell: "5.00",
    source: "SYN",
    effective_date: "2026-10-14",
  }));
const run = (ls = lines(), overrides: Record<string, unknown> = {}) =>
  allocateLanded(
    ls,
    ls.map((l) => l.id),
    landedProposal(
      landedCharges(
        ls.map((l) => l.id),
        overrides,
      ),
    ),
    "2026-10-14",
  );

test("landed shipment cents use stable largest remainder, independent of request/line order", () => {
  const result = run(lines().reverse(), { amount: "0.10" });
  assert.deepEqual(result.charges[0].allocations, [
    { line_id: ids[0], amount: "0.04" },
    { line_id: ids[1], amount: "0.03" },
    { line_id: ids[2], amount: "0.03" },
  ]);
  assert.deepEqual(
    result.bindings.map((b) => b.unit_cost),
    ["1.04", "1.03", "1.03"],
  );
  assert.equal(result.total, "0.10");
});
test("landed quantity and base-cost weights retain independently expected totals", () => {
  const ls = lines().slice(0, 2);
  ls[0].quantity = "2.000";
  assert.deepEqual(
    run(ls, {
      amount: "0.03",
      allocation: "Quantity",
    }).charges[0].allocations.map((a) => a.amount),
    ["0.02", "0.01"],
  );
  ls[0].quantity = "1.000";
  ls[0].unit_cost = "2.00";
  assert.deepEqual(
    run(ls, {
      amount: "0.10",
      allocation: "BaseCost",
    }).charges[0].allocations.map((a) => a.amount),
    ["0.07", "0.03"],
  );
});
test("landed Unit/Line bases and combined duty reconcile fractional quantity without losing cents", () => {
  const ls = lines().slice(0, 1);
  ls[0].quantity = "1.500";
  assert.equal(
    run(ls, { basis: "Unit", allocation: undefined, amount: "0.10" })
      .bindings[0].unit_cost,
    "1.10",
  );
  const proposal = landedCharges([ls[0].id], {
    basis: "Line",
    allocation: undefined,
    amount: "0.03",
  });
  proposal.charges.push({
    ...proposal.charges[0],
    id: randomUUID(),
    kind: "Duty",
    amount: "0.15",
    evidence_reference: "SYN-DUTY-01",
  });
  const r = allocateLanded(
    ls,
    [ls[0].id],
    landedProposal(proposal),
    "2026-10-14",
  );
  assert.equal(r.bindings[0].unit_cost, "1.12");
  assert.equal(r.bindings[0].landed.landed_cost, "1.68");
  assert.equal(r.total, "0.18");
});
test("landed rejects unrepresentable cents, mixed units, absent bases and standalone freight", () => {
  const ls = lines().slice(0, 1);
  ls[0].quantity = "3.000";
  assert.throws(() => run(ls, { amount: "0.01" }), {
    code: "LandedPrecisionUnsupported",
  });
  const mixed = lines();
  mixed[1].unit = "m";
  assert.throws(() => run(mixed, { allocation: "Quantity" }), {
    code: "InvalidData",
  });
  assert.throws(() => run(mixed, { basis: "Unit", allocation: undefined }), {
    code: "InvalidData",
  });
  assert.throws(
    () =>
      run(
        lines().map((l) => ({ ...l, unit_cost: "0.00" })),
        { allocation: "BaseCost" },
      ),
    { code: "InvalidData" },
  );
  assert.throws(
    () =>
      run([
        ...lines(),
        { ...lines()[0], id: randomUUID(), category: "Freight" },
      ]),
    { code: "StandaloneFreightConflict" },
  );
  assert.throws(() => run(lines(), { effective_date: "2026-10-15" }), {
    code: "InvalidData",
  });
});
test("landed requires explicit bounded evidence, distinct charges and exact selected product targets", () => {
  const good = landedCharges(ids);
  for (const changed of [
    { ...good, currency: "USD" },
    { ...good, exclusive_cost_basis_confirmed: false },
    { ...good, charges: [good.charges[0], good.charges[0]] },
    { ...good, charges: [{ ...good.charges[0], line_ids: [ids[0], ids[0]] }] },
    { ...good, charges: [{ ...good.charges[0], amount: "-1" }] },
    { ...good, charges: [{ ...good.charges[0], basis: "Line" }] },
  ])
    assert.throws(() => landedProposal(changed), { code: "InvalidData" });
  assert.throws(
    () => allocateLanded(lines(), [ids[0]], landedProposal(good), "2026-10-14"),
    { code: "InvalidData" },
  );
  assert.throws(() => run(lines().map((l) => ({ ...l, category: "Labour" }))), {
    code: "InvalidData",
  });
  assert.equal(run(lines(), { amount: "0.00" }).total, "0.00");
});
test("legacy source refresh rejects landed input and preserves its original shape", () => {
  const old = {
    estimate_version_id: randomUUID(),
    pricing_date: "2026-10-14",
    selections: [
      {
        line_id: ids[0],
        source_id: randomUUID(),
        revision_id: randomUUID(),
        expected_source_version: 1,
      },
    ],
  };
  assert.deepEqual(refreshProposal(old), old);
  assert.throws(
    () => refreshProposal({ ...old, landed_costs: landedCharges(ids) }),
    { code: "InvalidData" },
  );
  assert.ok(
    refreshProposal({ ...old, landed_costs: landedCharges(ids) }, 500, true)
      .landed_costs,
  );
});
