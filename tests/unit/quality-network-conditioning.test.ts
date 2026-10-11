import assert from "node:assert/strict";
import test from "node:test";
import type { CDPSession } from "@playwright/test";
import { assertCalibration, calibrationIssues, installNetworkConditions, networkConditions, networkMethod,
  type CalibrationSample } from "../../scripts/quality-network-conditioning";

test("network candidate is opt-in and retains the declared profile", async () => {
  assert.equal(networkMethod({}), "rule");
  for (const env of [{ PPO_NETWORK_METHOD: "unknown" }, { PPO_NETWORK_METHOD: "global" },
    { PPO_NETWORK_METHOD: "global", GITHUB_ACTIONS: "true", PPO_BENCHMARK_FIXTURE: "add-synthetic-load", PPO_COMPARISON_BLOCK: "cpu-assets-other" }])
    assert.throws(() => networkMethod(env));
  assert.equal(networkMethod({ PPO_NETWORK_METHOD: "global", GITHUB_ACTIONS: "true", PPO_BENCHMARK_FIXTURE: "add-synthetic-load", PPO_COMPARISON_BLOCK: "cpu-assets-network-test" }), "global");
  const calls: { command: string; args: unknown }[] = [];
  const cdp = { send: async (command: string, args: unknown) => { calls.push({ command, args }); return { ruleIds: ["observed-rule"] }; } } as unknown as CDPSession;
  assert.equal(await installNetworkConditions(cdp, "rule"), "observed-rule");
  assert.equal(await installNetworkConditions(cdp, "global"), null);
  assert.deepEqual(calls, [
    { command: "Network.emulateNetworkConditionsByRule", args: { offline: false, matchedNetworkConditions: [{ urlPattern: "", ...networkConditions }] } },
    { command: "Network.overrideNetworkState", args: networkConditions },
    { command: "Network.emulateNetworkConditions", args: networkConditions },
    { command: "Network.overrideNetworkState", args: networkConditions },
  ]);
});

const valid = (): CalibrationSample => ({ graph: { scripts: 13, stylesheets: 8 }, latency: [41, 42, 40, 45, 43],
  download: [{ elapsed_ms: 240, bytes: 250000, exact: true }, { elapsed_ms: 2040, bytes: 2500000, exact: true }],
  upload: [{ elapsed_ms: 240, bytes: 125000, exact: true }, { elapsed_ms: 2040, bytes: 1250000, exact: true }],
  parallel: { elapsed_ms: 2440, bytes: 3000000, exact: true } });

test("calibration rejects ignored caps, per-request caps, missing bytes, slow anchors and original failures", () => {
  assert.deepEqual(calibrationIssues(valid(), true), []);
  const unthrottled = valid(); unthrottled.download![1].elapsed_ms = 20; unthrottled.upload![1].elapsed_ms = 20;
  assert.deepEqual(calibrationIssues(unthrottled, false), []);
  assert.ok(calibrationIssues(unthrottled, true).includes("download-slope-outside-declared-band"));
  const perRequest = valid(); perRequest.parallel!.elapsed_ms = 440;
  assert.ok(calibrationIssues(perRequest, true).includes("parallel-aggregate-outside-declared-band"));
  const wrong = valid(); wrong.download![1].exact = false;
  assert.ok(calibrationIssues(wrong, true).includes("download-payload-mismatch"));
  assert.ok(calibrationIssues(valid(), false).includes("upload-unthrottled-anchor-too-slow"));
  const missing = valid(); delete missing.upload;
  assert.ok(calibrationIssues(missing, true).includes("missing-probes"));
  const failed = valid(); failed.error = "original timeout";
  assert.ok(calibrationIssues(failed, true).includes("original-operation-failed"));
  const latency = valid(); latency.latency = [1, 2, 3, 4, 5];
  assert.ok(calibrationIssues(latency, true).includes("latency-outside-declared-band"));
});

test("application measurement refuses a failed, stale, changed-profile or different-browser calibration", () => {
  const source = "a".repeat(40), verdict = { passed: true, source, browser: "recorded", conditions: networkConditions };
  assertCalibration(verdict, source, "recorded");
  assert.throws(() => assertCalibration({ ...verdict, passed: false }, source));
  assert.throws(() => assertCalibration(verdict, "b".repeat(40)));
  assert.throws(() => assertCalibration(verdict, source, "different"));
  assert.throws(() => assertCalibration({ ...verdict, conditions: { ...networkConditions, latency: 0 } }, source));
});
