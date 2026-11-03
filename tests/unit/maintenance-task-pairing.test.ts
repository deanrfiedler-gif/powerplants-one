import assert from "node:assert/strict";
import { test } from "node:test";
import { mappingFromPairs, pairTasks } from "../helpers/task-pairing";

// #770 review: the maintenance test helper pairs request tasks with scope items once and reuses the
// ids, so repeated descriptions keep their outcome attribution whatever order the report uses.
test("task pairing keeps identities across reordered reads, including repeated descriptions", () => {
  const tasks = [
    { id: "t1", description: "A" },
    { id: "t2", description: "A" },
    { id: "t3", description: "B" },
  ];
  const field = [
    { id: "s3", description: "B" },
    { id: "s1", description: "A" },
    { id: "s2", description: "A" },
  ];
  const pairs = pairTasks(tasks, field);
  assert.deepEqual(pairs.map((x) => [x.task.id, x.scope_item_id]), [["t1", "s1"], ["t2", "s2"], ["t3", "s3"]]);
  // Outcomes recorded against the paired items, in request order.
  const outcomes = ["Complete", "Partial", "Complete"];
  const recorded = Object.fromEntries(pairs.map(({ index, scope_item_id }) => [scope_item_id, outcomes[index]]));
  // The report lists the repeated items in reverse; the mapping still names the same items.
  const snapshot = [
    { id: "s2", task_description: "A" },
    { id: "s1", task_description: "A" },
    { id: "s3", task_description: "B" },
  ];
  const mapping = mappingFromPairs(pairs, snapshot, "SYN");
  assert.deepEqual(mapping.map((m) => [m.task_id, m.scope_item_id]), [["t1", "s1"], ["t2", "s2"], ["t3", "s3"]]);
  // Each task's received outcome is the one recorded for it: t2 stays Partial, not t1.
  assert.deepEqual(mapping.map((m) => [m.task_id, recorded[m.scope_item_id]]), [["t1", "Complete"], ["t2", "Partial"], ["t3", "Complete"]]);
  // Distinct descriptions in any order still pair by wording.
  assert.deepEqual(
    pairTasks([{ id: "x", description: "B" }, { id: "y", description: "A" }], [{ id: "a", description: "A" }, { id: "b", description: "B" }]).map((x) => x.scope_item_id),
    ["b", "a"],
  );
  // A missing or changed snapshot item is refused rather than silently remapped.
  assert.throws(() => mappingFromPairs(pairs, snapshot.slice(1), "SYN"), /lacks scope item s2/);
  assert.throws(() => mappingFromPairs(pairs, [{ id: "s1", task_description: "A" }, { id: "s2", task_description: "B" }, { id: "s3", task_description: "B" }], "SYN"), /lacks scope item s2/);
  assert.throws(() => pairTasks([{ id: "t", description: "C" }], field), /No scope item for request task 1/);
});
