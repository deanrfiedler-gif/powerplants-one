import assert from "node:assert/strict";
import { test } from "node:test";
import { moveNeedsSiteReadiness } from "../../src/scheduling/planner-move";

const basis = {
  preparation: { outcome: "Pass" },
  start_at: "2031-09-22T00:00:00.000Z",
  end_at: "2031-09-22T01:00:00Z",
  site_timezone: "Australia/Brisbane",
};
test("D5 warns when SITE_READINESS applies and either proposed instant changes", () => {
  assert.equal(moveNeedsSiteReadiness(basis, "2031-09-22T10:30", "2031-09-22T11:00"), true);
  assert.equal(moveNeedsSiteReadiness(basis, "2031-09-22T10:00", "2031-09-22T11:30"), true);
});
test("D5 does not warn for unchanged times, absent SITE_READINESS or incomplete input", () => {
  assert.equal(moveNeedsSiteReadiness(basis, "2031-09-22T10:00", "2031-09-22T11:00"), false);
  for (const preparation of [null, undefined])
    assert.equal(moveNeedsSiteReadiness({ ...basis, preparation }, "2031-09-22T10:30", "2031-09-22T11:30"), false);
  assert.equal(moveNeedsSiteReadiness(basis, "", "2031-09-22T11:00"), false);
});
