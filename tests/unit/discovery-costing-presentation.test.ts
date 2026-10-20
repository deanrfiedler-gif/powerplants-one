import test from "node:test";
import assert from "node:assert/strict";
import {
  compareCostLines,
  sellChange,
  allowanceTotal,
  proposalAmounts,
  retainedSource,
} from "../../src/components/discovery-costing-model";
import type { CostLine } from "../../src/estimating/math";
const line: CostLine = {
  id: "10000000-0000-4000-8000-000000000001",
  description: "SYN motor",
  category: "Product",
  quantity: "3",
  unit: "each",
  unit_cost: "0.01",
  unit_sell: "0.03",
  source: "SYN reviewed quote",
  effective_date: "2026-10-02",
  allowance: false,
};
test("cost comparison uses stable IDs, preserves removed lines, and does not equate renamed lines", () => {
  const other = { ...line, id: "10000000-0000-4000-8000-000000000002" };
  const result = compareCostLines([line], [other]);
  assert.deepEqual(result.added, [other]);
  assert.deepEqual(result.removed, [line]);
  assert.deepEqual(result.changed, [other]);
  assert.equal(
    compareCostLines([line, other], [other, line]).changed.length,
    0,
  );
  assert.equal(
    compareCostLines([line], [{ ...line, source: "SYN new quote" }]).changed
      .length,
    1,
  );
  assert.equal(
    compareCostLines([line], [{ ...line, allowance: undefined }]).changed
      .length,
    1,
  );
});
test("proposal comparison and allowance totals retain exact base-10 policy and unknowns", () => {
  assert.equal(sellChange("31210.00", "46210.00"), "+15,000.00");
  assert.equal(sellChange("0.30", "0.20"), "-0.10");
  assert.equal(sellChange("0.30", "0.30"), "0.00");
  assert.equal(sellChange(null, "2.00"), null);
  assert.equal(proposalAmounts([line])?.sell, "0.09");
  assert.equal(allowanceTotal([{ ...line, allowance: true }]), "0.09");
  assert.equal(allowanceTotal([line]), "0.00");
  assert.equal(allowanceTotal([{ ...line, allowance: undefined }]), null);
  assert.equal(proposalAmounts([{ ...line, unit_cost: "" }]), null);
  assert.equal(proposalAmounts([{ ...line, unit_sell: "0.00" }]), null);
});
test("only a retained typed source binding enables ES-03 handover", () => {
  const binding = {
    line_id: line.id,
    source_id: "source",
    source_revision_id: "revision",
    review_event_id: "review",
    pricing_date: "2026-10-02",
    tier_minimum_quantity: "1",
    unit_cost: "0.01",
  };
  assert.equal(retainedSource(line, [line], []), null);
  assert.deepEqual(
    retainedSource(
      { ...line, description: "SYN renamed motor" },
      [line],
      [binding],
    ),
    binding,
  );
  for (const field of [
    "quantity",
    "unit",
    "unit_cost",
    "source",
    "effective_date",
  ] as const)
    assert.equal(
      retainedSource({ ...line, [field]: "changed" }, [line], [binding]),
      null,
      field,
    );
});
