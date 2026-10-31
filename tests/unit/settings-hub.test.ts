import { test } from "node:test";
import assert from "node:assert/strict";
import { requireIndependentPolicyReviewer } from "../../src/scheduling/policy-authority";
import { configurationAreas } from "../../src/admin/settings";
test("AD-02 refuses a proposer as reviewer without changing historical evidence validators", () => {
  assert.throws(
    () => requireIndependentPolicyReviewer("proposer", "proposer"),
    { code: "IndependentReviewerRequired" },
  );
  assert.doesNotThrow(() =>
    requireIndependentPolicyReviewer("proposer", "reviewer"),
  );
});
test("AD-02 retains nine areas while unbuilt areas have no invented destinations", () => {
  assert.equal(configurationAreas.length, 9);
  assert.deepEqual(
    configurationAreas.filter((a) => a.href).map((a) => a.id),
    ["policies", "access", "health"],
  );
  assert(
    configurationAreas
      .find((a) => a.id === "templates")!
      .status.includes("not yet merged"),
  );
});
