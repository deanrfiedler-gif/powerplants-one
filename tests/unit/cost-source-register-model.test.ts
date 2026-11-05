import assert from "node:assert/strict";
import { test } from "node:test";
import {
  exactSourceHref,
  sourceCsv,
  sourceDate,
  sourceMoney,
  sourceSelectionCurrent,
  sourceStateLabel,
  type CostSourceRow,
} from "../../src/estimating/cost-source-register-model";

const row = {
  id: "source",
  revision_id: "exact-revision",
  version: 4,
  content_hash: "exact-hash",
  revision: 2,
  reference: "SYN-SRC-1",
  title: "=SUM(1,2)",
  supplier: "SYN supplier",
  item: "SYN item",
  unit: "each",
  tier_1: { minimum_quantity: "7.000", unit_cost: "0.00" },
  currency: "AUD",
  tax_basis: "ExcludingTax",
  state: "Submitted",
  your_submission: false,
  effective_from: "2026-01-01",
  valid_until: null,
  updated_at: "2026-10-31T00:00:00Z",
} as unknown as CostSourceRow;

test("selection requires the same exact source version and revision on a fresh permitted page", () => {
  assert.equal(sourceSelectionCurrent([row], [{ ...row }]), true);
  for (const changed of [
    { ...row, version: 5 },
    { ...row, revision_id: "successor" },
    { ...row, content_hash: "different" },
  ])
    assert.equal(sourceSelectionCurrent([row], [changed]), false);
  assert.equal(sourceSelectionCurrent([row], []), false);
  assert.equal(sourceSelectionCurrent([], [row]), false);
});
test("export preserves exact minimum, cost, unit and unknown expiry without formula execution", () => {
  const before = JSON.stringify(row);
  const csv = sourceCsv([row]);
  assert.match(csv, /"7\.000","each","0\.00","AUD","ExcludingTax"/);
  assert.match(csv, /"'=SUM\(1,2\)"/);
  assert.match(csv, /"exact-revision"/);
  assert.match(csv, /"Unknown"/);
  assert.equal(JSON.stringify(row), before);
  assert.equal(sourceMoney("123456789.00"), "$123,456,789.00");
  assert.equal(sourceDate(null), "Unknown");
});
test("expiry does not change review state and navigation pins the selected revision", () => {
  const expired = { ...row, expiry_past: true };
  assert.equal(sourceStateLabel(expired), "Awaiting review");
  assert.equal(
    sourceStateLabel({ ...row, your_submission: true }),
    "Your submission",
  );
  assert.equal(sourceStateLabel({ ...row, state: "Reviewed" }), "Reviewed");
  assert.equal(
    exactSourceHref("source", "rev/one"),
    "/estimating/cost-sources/source?revision_id=rev%2Fone",
  );
});
