import assert from "node:assert/strict";
import type { CDPSession } from "@playwright/test";

export const networkConditions = { offline: false, latency: 40, downloadThroughput: 1250000,
  uploadThroughput: 625000, connectionType: "wifi" as const };
export type NetworkMethod = "rule" | "global" | "packet";

export function networkMethod(env: Record<string, string | undefined>): NetworkMethod {
  const method = env.PPO_NETWORK_METHOD ?? "rule";
  assert.ok(method === "rule" || method === "global" || method === "packet", "Unknown network method");
  if (method !== "rule") {
    assert.equal(env.GITHUB_ACTIONS, "true");
    assert.equal(env.PPO_BENCHMARK_FIXTURE, "add-synthetic-load");
    assert.match(env.PPO_COMPARISON_BLOCK ?? "", /^cpu-assets-network-[a-z0-9-]+$/);
    if (method === "packet") assert.equal(env.PPO_NETWORK_CANDIDATE, "packet");
  }
  return method;
}

export async function installNetworkConditions(cdp: CDPSession, method: NetworkMethod) {
  let rule: string | null = null;
  if (method === "rule") {
    const result = await cdp.send("Network.emulateNetworkConditionsByRule", {
      offline: false, matchedNetworkConditions: [{ urlPattern: "", ...networkConditions }],
    });
    assert.equal(result.ruleIds.length, 1); rule = result.ruleIds[0];
  } else if (method === "global") {
    await cdp.send("Network.emulateNetworkConditions", networkConditions);
  }
  await cdp.send("Network.overrideNetworkState", networkConditions);
  return rule;
}

type Transfer = { elapsed_ms: number; bytes: number; exact: boolean };
export type CalibrationSample = { error?: string; graph?: { scripts: number; stylesheets: number };
  latency?: number[]; download?: Transfer[]; upload?: Transfer[]; parallel?: Transfer };
export function calibrationIssues(sample: CalibrationSample, conditioned: boolean): string[] {
  const issues: string[] = [];
  if (sample.error) issues.push("original-operation-failed");
  if (sample.graph?.scripts !== 13 || sample.graph?.stylesheets !== 8) issues.push("asset-graph-incomplete");
  if (sample.latency?.length !== 5 || sample.download?.length !== 2 || sample.upload?.length !== 2 || !sample.parallel)
    return [...issues, "missing-probes"];
  const latency = [...sample.latency].sort((a, b) => a - b)[2];
  const between = (n: number, expected: number) => Number.isFinite(n) && n >= expected * .75 && n <= expected * 1.25;
  if (conditioned && !(latency >= 30 && latency <= 250)) issues.push("latency-outside-declared-band");
  for (const [name, probes, rate] of [["download", sample.download, 1250000], ["upload", sample.upload, 625000]] as const) {
    if (!probes.every(p => p.exact)) issues.push(`${name}-payload-mismatch`);
    const expected = 1000 * (probes[1].bytes - probes[0].bytes) / rate;
    if (conditioned && !between(probes[1].elapsed_ms - probes[0].elapsed_ms, expected)) issues.push(`${name}-slope-outside-declared-band`);
    if (!conditioned && probes[1].elapsed_ms >= 1500) issues.push(`${name}-unthrottled-anchor-too-slow`);
  }
  if (!sample.parallel.exact || sample.parallel.bytes !== 3000000) issues.push("parallel-payload-mismatch");
  if (conditioned && !between(sample.parallel.elapsed_ms, 2400)) issues.push("parallel-aggregate-outside-declared-band");
  return issues;
}

export function assertCalibration(verdict: { passed?: boolean; source?: string; browser?: string; conditions?: unknown; candidate?: string }, source: string, browser?: string, candidate = "global") {
  assert.equal(verdict.passed, true, "Independent network calibration must pass before application samples");
  assert.equal(verdict.source, source, "Calibration must belong to this source");
  assert.deepEqual(verdict.conditions, networkConditions);
  assert.equal(verdict.candidate ?? "global", candidate, "Calibration must qualify the selected method");
  if (browser) assert.equal(verdict.browser, browser, "Calibration must use the same Chrome version");
}
