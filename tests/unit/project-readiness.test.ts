import assert from "node:assert/strict";
import { test } from "node:test";
import {
  materialState,
  readinessSummary,
  type SourceFamily,
} from "../../src/projects/readiness/model";

test("PJ07 empty, incomplete and source-satisfied observations never establish project release", () => {
  for (const coverage of ["Complete", "Partial", "Unavailable"] as const) {
    const family: SourceFamily = {
      kind: "MaterialDemand",
      coverage,
      evidence: "Missing",
      items: [],
      count: 0,
      count_scope: "PermittedCandidateWindow",
      limit: 50,
    };
    const summary = readinessSummary([family]);
    assert.equal(summary.state, "NotAssessed");
    assert.equal(summary.full_scope_assessed, false);
    assert.equal(summary.can_release, false);
  }
  assert.equal(
    materialState("Ready for the stated material scope"),
    "SatisfiedForSourceScope",
  );
  assert.equal(materialState("unknown future source state"), "EvidenceNeeded");
});
