import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dealHistory,
  pipelineInsights,
  type DealFact,
} from "../../src/crm/insights";
const fact = (
  version: number,
  close_date: string | null,
  from_stage = "Discovery",
  to_stage = "Discovery",
): DealFact => ({
  version,
  close_date,
  from_stage,
  to_stage,
  close_recorded: true,
  at: `2026-09-${String(version).padStart(2, "0")}T00:00:00Z`,
});
test("observed close history retains unknown, counts actual changes and only positive date slippage", () => {
  const r = dealHistory(
    [
      fact(1, "2026-10-01"),
      fact(2, "2026-10-10"),
      fact(3, "2026-10-05"),
      fact(4, null),
      fact(5, "2026-11-01"),
    ],
    "2026-09-10T00:00:00Z",
  );
  assert.equal(r.changes, 4);
  assert.equal(r.slipped_days, 9);
  assert.equal(r.close_history_available, true);
  assert.equal(dealHistory([], "2026-09-10").close_history_available, false);
});
test("stage durations use recorded transitions and never fabricate an earlier entry", () => {
  const r = dealHistory(
    [
      fact(2, null, "Discovery", "Scoping"),
      fact(5, null, "Scoping", "Quoting"),
    ],
    "2026-09-10T00:00:00Z",
  );
  assert.deepEqual(
    r.stages.map((s) => [s.stage, s.days]),
    [
      ["Scoping", 3],
      ["Quoting", 5],
    ],
  );
});
test("empty scoped population keeps a zero denominator and known zero distinct from unknown", () => {
  const r = pipelineInsights([], "2026-09-10T00:00:00Z");
  assert.equal(r.denominator, 0);
  assert.equal(r.values.formatted, "$0.00");
  assert.equal(r.coverage.Unavailable, 0);
});
