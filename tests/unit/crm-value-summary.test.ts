import { test } from "node:test";
import assert from "node:assert/strict";
import { valueSummary } from "../../src/crm/value-summary";

test("CRM totals retain cents and distinguish unknown from known zero", () => {
  assert.deepEqual(
    valueSummary([
      { value_amount: "127500.50" },
      { value_amount: "0" },
      { value_amount: null },
      { value_amount: "0.10" },
      { value_amount: "0.20" },
    ]),
    { formatted: "$127,500.80", unknown: 1 },
  );
  assert.deepEqual(valueSummary([]), { formatted: "$0.00", unknown: 0 });
  assert.deepEqual(
    valueSummary([
      { value_amount: "99999999999999.99" },
      { value_amount: "0.01" },
    ]),
    { formatted: "$100,000,000,000,000.00", unknown: 0 },
  );
});
