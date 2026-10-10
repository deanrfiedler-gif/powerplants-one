import assert from "node:assert/strict";

// Ten browsers remain the default acceptance workload. A single browser is
// available only as an explicitly named synthetic startup diagnostic.
export function comparisonProfile(env: Record<string, string | undefined>) {
  const profile = env.PPO_COMPARISON_PROFILE ?? "ten-user";
  if (profile === "ten-user") return { profile, browser_count: 10, single_browser_diagnostic: false };
  assert.equal(profile, "startup-single", "Unknown comparison profile");
  assert.equal(env.PPO_BENCHMARK_FIXTURE, "add-synthetic-load");
  assert.match(env.PPO_COMPARISON_BLOCK ?? "", /^startup-[a-z0-9-]+$/);
  return { profile, browser_count: 1, single_browser_diagnostic: true };
}
