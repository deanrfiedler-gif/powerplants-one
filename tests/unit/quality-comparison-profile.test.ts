import assert from "node:assert/strict";
import test from "node:test";
import { comparisonProfile, cpuAllocation } from "../../scripts/quality-comparison-profile";

test("ordinary comparisons retain ten browsers; single-browser work must be declared diagnostic", () => {
  assert.equal(comparisonProfile({}).browser_count, 10);
  assert.equal(comparisonProfile({ PPO_COMPARISON_PROFILE: "ten-user" }).single_browser_diagnostic, false);
  const diagnostic = { PPO_COMPARISON_PROFILE: "startup-single", PPO_BENCHMARK_FIXTURE: "add-synthetic-load", PPO_COMPARISON_BLOCK: "startup-test" };
  assert.deepEqual(comparisonProfile(diagnostic), { profile: "startup-single", browser_count: 1, single_browser_diagnostic: true });
  assert.throws(() => comparisonProfile({ ...diagnostic, PPO_COMPARISON_BLOCK: "observer-test" }));
  assert.throws(() => comparisonProfile({ ...diagnostic, PPO_BENCHMARK_FIXTURE: undefined }));
  assert.throws(() => comparisonProfile({ PPO_COMPARISON_PROFILE: "2" }));
});

test("CPU diagnostic rejects accidental local use, overlaps and changed capacity", () => {
  assert.equal(cpuAllocation({}), null);
  const env = { GITHUB_ACTIONS: "true", PPO_BENCHMARK_FIXTURE: "add-synthetic-load", PPO_COMPARISON_BLOCK: "cpu-test",
    PPO_CPU_MODE: "partitioned", PPO_SERVER_CPUS: "0", PPO_BROWSER_CPUS: "1,2,3" };
  assert.deepEqual(cpuAllocation(env), { mode: "partitioned", server: [0], browser_driver: [1, 2, 3] });
  assert.deepEqual(cpuAllocation({ ...env, PPO_CPU_MODE: "shared", PPO_SERVER_CPUS: "0,1,2,3", PPO_BROWSER_CPUS: "0,1,2,3" })?.server, [0, 1, 2, 3]);
  const wholeCore = { ...env, PPO_COMPARISON_BLOCK: "cpu-core-test", PPO_CPU_LAYOUT: "physical-core", PPO_SERVER_CPUS: "0,1", PPO_BROWSER_CPUS: "2,3" };
  assert.deepEqual(cpuAllocation(wholeCore)?.server, [0, 1]);
  assert.throws(() => cpuAllocation({ ...wholeCore, PPO_COMPARISON_BLOCK: "cpu-test" }));
  assert.throws(() => cpuAllocation({ ...wholeCore, PPO_BROWSER_CPUS: "1,2" }));
  for (const invalid of [{ GITHUB_ACTIONS: "false" }, { PPO_COMPARISON_BLOCK: "candidate-test" },
    { PPO_BROWSER_CPUS: "0,1,2" }, { PPO_SERVER_CPUS: "0,1" }, { PPO_CPU_MODE: "shared" },
    { PPO_BROWSER_CPUS: "1,1,2" }, { PPO_SERVER_CPUS: "0;echo" }]) assert.throws(() => cpuAllocation({ ...env, ...invalid }));
});
