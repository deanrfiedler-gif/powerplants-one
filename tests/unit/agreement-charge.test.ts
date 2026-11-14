import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { chargeSchedule } from "../../src/maintenance/charge-schedule";
import { agreementFields } from "../../src/maintenance/model";
import { agreementContent } from "../helpers/maintenance";
const input = () => ({
  currency: "AUD",
  tax_basis: "Synthetic ex GST",
  lines: [{ id: randomUUID(), amount: "4800.00" }],
});
test("C1 explicit annual advance default uses effective date, exact cents and no inferred old fee", () => {
  const x = input();
  assert.equal(
    chargeSchedule(x, "2026-01-01", "2026-12-31").lines[0].due_date,
    "2026-01-01",
  );
  assert.equal(
    chargeSchedule(x, "2026-01-01", "2026-12-31").lines[0].amount,
    "4800.00",
  );
  assert.equal("charge_schedule" in agreementFields(agreementContent()), false);
});
test("C1 rejects rounding, nonpositive money, duplicate identities, invalid dates and unknown policy fields", () => {
  for (const amount of [
    "0.00",
    "-1.00",
    "1.001",
    "1e3",
    4800,
    "1",
    "01.00",
    "1000000000000.00",
  ]) {
    const x = input();
    x.lines[0].amount = amount as string;
    assert.throws(() => chargeSchedule(x, "2026-01-01", "2026-12-31"));
  }
  const x = input();
  assert.throws(() =>
    chargeSchedule(
      { ...x, lines: [...x.lines, ...x.lines] },
      "2026-01-01",
      "2026-12-31",
    ),
  );
  for (const due_date of ["2025-12-31", "2027-01-01", "2026-02-30"])
    assert.throws(() =>
      chargeSchedule(
        { ...x, lines: [{ ...x.lines[0], due_date }] },
        "2026-01-01",
        "2026-12-31",
      ),
    );
  assert.throws(() =>
    chargeSchedule({ ...x, tax_rate: "0.1" }, "2026-01-01", "2026-12-31"),
  );
});
