// Run from the repository root. Discovery proof only; --list executes no case.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";

function cases(project) {
  const env = { ...process.env };
  delete env.PLAYWRIGHT_JSON_OUTPUT_NAME;
  const result = spawnSync(process.execPath, [
    "node_modules/@playwright/test/cli.js", "test", "--config=playwright.compiled.config.ts",
    ...(project ? [`--project=${project}`] : []), "--list", "--reporter=json",
  ], { encoding: "utf8", env, timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.errors ?? [], []);
  const keys = [];
  function walk(suites) {
    for (const suite of suites) {
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests) keys.push(JSON.stringify([test.projectName, spec.id]));
      }
      walk(suite.suites ?? []);
    }
  }
  walk(report.suites);
  assert.equal(keys.length, new Set(keys).size);
  return keys.sort();
}
const all = cases(), desktop = cases("desktop-chromium"), mobile = cases("mobile-chromium");
assert.deepEqual([...new Set([...desktop, ...mobile])].sort(), all);
const overlap = desktop.filter((key) => mobile.includes(key));
assert.ok(overlap.length > 0);
assert.ok(overlap.every((key) => JSON.parse(key)[0] === "warm-up"));
const counts = (keys) => keys.reduce((totals, key) => {
  const [project] = JSON.parse(key);
  totals[project] = (totals[project] ?? 0) + 1;
  return totals;
}, {});
assert.deepEqual(Object.keys(counts(desktop)).sort(), ["desktop-chromium", "warm-up"]);
assert.deepEqual(Object.keys(counts(mobile)).sort(), ["mobile-chromium", "warm-up"]);
console.log(JSON.stringify({
  source_reference: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  boundary: "Playwright discovery only. No browser/application case is executed by --list.",
  all: counts(all), desktop: counts(desktop), mobile: counts(mobile),
  original_selection_sha256: createHash("sha256").update(JSON.stringify(all)).digest("hex"),
  result: "Both selections cover every original test. Only the existing warm-up dependency repeats in the two isolated jobs.",
}, null, 2));
