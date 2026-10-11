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

// CPU placement is an explicit existing-CI diagnostic, never the default profile.
export function cpuAllocation(env: Record<string, string | undefined>) {
  if (!env.PPO_CPU_MODE && !env.PPO_SERVER_CPUS && !env.PPO_BROWSER_CPUS) return null;
  assert.equal(env.GITHUB_ACTIONS, "true");
  assert.equal(env.PPO_BENCHMARK_FIXTURE, "add-synthetic-load");
  assert.match(env.PPO_COMPARISON_BLOCK ?? "", /^cpu-[a-z0-9-]+$/);
  assert.ok(["shared", "partitioned"].includes(env.PPO_CPU_MODE ?? ""));
  if (env.PPO_CPU_LAYOUT) {
    assert.equal(env.PPO_CPU_LAYOUT, "physical-core");
    assert.match(env.PPO_COMPARISON_BLOCK ?? "", /^cpu-(core|assets)-[a-z0-9-]+$/);
  }
  const parse = (text: string | undefined) => {
    assert.match(text ?? "", /^\d+(,\d+)*$/);
    const values = text!.split(",").map(Number);
    assert.deepEqual(values, [...new Set(values)].sort((a, b) => a - b));
    return values;
  };
  const server = parse(env.PPO_SERVER_CPUS), browser_driver = parse(env.PPO_BROWSER_CPUS);
  if (env.PPO_CPU_MODE === "shared") {
    assert.equal(server.length, 4); assert.deepEqual(server, browser_driver);
  } else {
    assert.equal(server.length, env.PPO_CPU_LAYOUT ? 2 : 1); assert.equal(browser_driver.length, env.PPO_CPU_LAYOUT ? 2 : 3);
    assert.ok(server.every(cpu => !browser_driver.includes(cpu)));
  }
  return { mode: env.PPO_CPU_MODE, server, browser_driver };
}
