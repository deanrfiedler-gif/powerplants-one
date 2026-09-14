import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "verification-evidence/p11-performance";
await mkdir(root, { recursive: true });
const comparisonId = randomUUID();
const outcomes: { profile: string; exit_code: number | null; signal: string | null; groups: unknown }[] = [];
for (const profile of ["development", "compiled"]) {
  const child = spawn(process.execPath, ["--env-file=.env.local", "--import", "tsx", "scripts/quality-performance-sample.ts", ...(profile === "compiled" ? ["--compiled"] : [])], { stdio: "inherit", env: { ...process.env, PPO_PERFORMANCE_COMPARISON_ID: comparisonId } });
  const [exit_code, signal] = await once(child, "exit") as [number | null, string | null];
  const path = `${root}/${profile === "compiled" ? "compiled/" : ""}PT-27-proof.json`;
  const proof = await readFile(path, "utf8").then(JSON.parse).catch(() => null);
  outcomes.push({ profile, exit_code, signal, groups: proof?.comparison_id === comparisonId ? proof.groups : null });
  await writeFile(`${root}/profile-comparison.json`, JSON.stringify({
    comparison_id: comparisonId,
    source_head: process.env.PPO_SOURCE_HEAD ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim(),
    run_id: process.env.GITHUB_RUN_ID ?? null, run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    outcomes, candidate_ms: 3000, candidate_only: true,
    limits: "Ordered profiles on the same retained synthetic fixture and runner: development then compiled. Fresh application/browser processes and browser caches, retained database/OS caches. Every original result remains separate; no retries, warm-up substitution or causal production inference. Existing CI deadlines apply to the combined procedure.",
  }, null, 2));
}
assert.ok(outcomes.every(outcome => outcome.exit_code === 0 && !outcome.signal), "Both original profiles must complete without core-read or capture failures; inspect each retained original outcome");
