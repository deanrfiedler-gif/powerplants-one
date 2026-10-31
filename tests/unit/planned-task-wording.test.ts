import assert from "node:assert/strict";
import { test } from "node:test";
import { plannedTaskWordingGaps } from "../../src/service/planned-task-wording";

// #770 review R2: the work order warning compares plan task wording by count, not set membership.
test("plan wording gaps catch replacement with another task's wording, removal and lost repeats", () => {
  const A = "SYN inspect the dosing enclosure",
    B = "SYN read the controller firmware label";
  const none = { unmatched: [], missing: [] };
  // Unchanged scope, in any order: no warning.
  assert.deepEqual(plannedTaskWordingGaps([A, B], [A, B]), none);
  assert.deepEqual(plannedTaskWordingGaps([A, B], [B, A]), none);
  // Edited wording: the item no longer matches and its plan task is missing.
  assert.deepEqual(plannedTaskWordingGaps([A, B], [A, `${B} and glands`]), {
    unmatched: [2],
    missing: [B],
  });
  // B replaced by A: every item matches some plan task, but B has no item (set membership missed this).
  assert.deepEqual(plannedTaskWordingGaps([A, B], [A, A]), {
    unmatched: [],
    missing: [B],
  });
  // A removed task is missing; restoring it clears the warning.
  assert.deepEqual(plannedTaskWordingGaps([A, B], [A]), { unmatched: [], missing: [B] });
  assert.deepEqual(plannedTaskWordingGaps([A, B], [A, B]), none);
  // Legitimately repeated plan wording needs one item per task, and an extra item is allowed.
  assert.deepEqual(plannedTaskWordingGaps([A, A, B], [A, A, B]), none);
  assert.deepEqual(plannedTaskWordingGaps([A, A, B], [A, B]), { unmatched: [], missing: [A] });
  assert.deepEqual(plannedTaskWordingGaps([A, B], [A, B, A]), none);
  // No plan tasks (not a maintenance work order): nothing to compare.
  assert.deepEqual(plannedTaskWordingGaps([], [A]), { unmatched: [1], missing: [] });
});
