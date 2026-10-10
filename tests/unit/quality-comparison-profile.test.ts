import assert from "node:assert/strict";
import test from "node:test";
import { comparisonProfile } from "../../scripts/quality-comparison-profile";

test("ordinary comparisons retain ten browsers; single-browser work must be declared diagnostic", () => {
  assert.equal(comparisonProfile({}).browser_count, 10);
  assert.equal(comparisonProfile({ PPO_COMPARISON_PROFILE: "ten-user" }).single_browser_diagnostic, false);
  const diagnostic = { PPO_COMPARISON_PROFILE: "startup-single", PPO_BENCHMARK_FIXTURE: "add-synthetic-load", PPO_COMPARISON_BLOCK: "startup-test" };
  assert.deepEqual(comparisonProfile(diagnostic), { profile: "startup-single", browser_count: 1, single_browser_diagnostic: true });
  assert.throws(() => comparisonProfile({ ...diagnostic, PPO_COMPARISON_BLOCK: "observer-test" }));
  assert.throws(() => comparisonProfile({ ...diagnostic, PPO_BENCHMARK_FIXTURE: undefined }));
  assert.throws(() => comparisonProfile({ PPO_COMPARISON_PROFILE: "2" }));
});
