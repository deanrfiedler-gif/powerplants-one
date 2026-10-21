import assert from "node:assert/strict";
import { test } from "node:test";
import {
  carryProposalForward,
  detailsToComplete,
  hierarchyRows,
  measurement,
} from "../../src/shared/facilities/presentation";
import type { RegisterRow } from "../../src/shared/facilities/reads";

test("CS-05 Q3: missing and Unknown details stay distinct from recorded numbers", () => {
  const complete = {
    structure_type: "greenhouse",
    use: "production",
    footprint_m2: "1152",
  };
  assert.equal(detailsToComplete(complete), false);
  for (const patch of [
    { structure_type: "unknown" },
    { use: "unknown" },
    { use: null },
    { footprint_m2: null },
  ])
    assert.equal(detailsToComplete({ ...complete, ...patch }), true);
  assert.equal(measurement(null, " m²"), "Not recorded");
  assert.equal(measurement("1152", " m²"), "1,152 m²");
  assert.equal(measurement(0), "0");
});
test("CS-05 hierarchy retains filtered rows, orders recorded parents and never fabricates ancestors", () => {
  const row = (id: string, parent: string | null) =>
    ({ id, parent_facility_id: parent }) as RegisterRow;
  const input = [
    row("bay", "house"),
    row("house", null),
    row("filtered-child", "missing"),
  ];
  assert.deepEqual(
    hierarchyRows(input).map(({ row, depth }) => [row.id, depth]),
    [
      ["house", 0],
      ["bay", 1],
      ["filtered-child", 0],
    ],
  );
  assert.equal(hierarchyRows([row("a", "b"), row("b", "a")]).length, 2);
  assert.deepEqual(
    input.map((r) => r.id),
    ["bay", "house", "filtered-child"],
  );
});
test("CS-05 conflict: keep explicit edits and clearing without reversing unrelated newer values", () => {
  const before = {
    footprint: "1152",
    season: "Spring",
    crop: "Tomatoes",
    parent: "house",
  };
  const draft = { ...before, footprint: "1188", season: null };
  const latest = {
    ...before,
    footprint: "1160",
    crop: "Capsicum",
    parent: "new-house",
  };
  assert.deepEqual(carryProposalForward(before, draft, latest), {
    footprint: "1188",
    season: null,
    crop: "Capsicum",
    parent: "new-house",
  });
  assert.equal(before.season, "Spring");
});
