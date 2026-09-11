import { performance } from "node:perf_hooks";
import { freemem, loadavg } from "node:os";

// Values only: no process arguments, environment, paths, URLs or payloads.
export function runtimeSampler() {
  let at = performance.now();
  let cpu = process.cpuUsage();
  let loop = performance.eventLoopUtilization();
  return () => {
    const now = performance.now();
    const nextCpu = process.cpuUsage();
    const nextLoop = performance.eventLoopUtilization();
    const delta = performance.eventLoopUtilization(nextLoop, loop);
    const sample = {
      interval_ms: now - at,
      cpu_user_ms: (nextCpu.user - cpu.user) / 1000,
      cpu_system_ms: (nextCpu.system - cpu.system) / 1000,
      event_loop_active_ms: delta.active,
      event_loop_idle_ms: delta.idle,
      rss_bytes: process.memoryUsage().rss,
      system_free_bytes: freemem(),
      system_load_1m: loadavg()[0],
    };
    at = now; cpu = nextCpu; loop = nextLoop;
    return sample;
  };
}
