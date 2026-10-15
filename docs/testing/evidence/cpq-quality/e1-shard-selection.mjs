// Run from the repository root. Synthetic markers prove native file partitioning
// and failure propagation only; this does not execute database behaviour.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const baseline = "3b7509f977df086f6bb8f2d40787e3b6678798e4";
const workflowPath = ".github/workflows/estimating-e1.yml";
const workflow = readFileSync(workflowPath, "utf8").replaceAll("\r\n", "\n");
const previous = execFileSync("git", ["show", `${baseline}:${workflowPath}`], { encoding: "utf8" });
const selection = (text) => {
  const command = text.split("\n").find((line) => line.includes("tests/database/estimating.test.ts"));
  assert.ok(command);
  return [...command.matchAll(/tests\/database\/[\w-]+\.test\.ts/g)].map(([path]) => path);
};
const files = selection(workflow);
assert.deepEqual(files, selection(previous), "Preserve the complete original ordered file selection");
assert.equal(new Set(files).size, files.length);
assert.equal(files.length, 30);
mkdirSync("tmp", { recursive: true });
const fixture = mkdtempSync(join("tmp", "e1-shard-selection-"));
mkdirSync(join(fixture, "tests/database"), { recursive: true });
writeFileSync(join(fixture, "package.json"), '{"type":"module"}\n');
const marker = (file, fail = false) => writeFileSync(join(fixture, file),
  `import test from "node:test";\ntest(${JSON.stringify(`selection:${file}`)}, () => { ${fail ? 'throw Error("intentional selection negative control");' : ""} });\n`);
files.forEach((file) => marker(file));
function partition(failingFile) {
  const shards = ["1/2", "2/2"].map((shard) => {
    const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-reporter=tap",
      "--test-concurrency=1", "--test-timeout=120000", `--test-shard=${shard}`, ...files],
    { cwd: fixture, encoding: "utf8", timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    assert.ifError(result.error);
    const selected = [...result.stdout.matchAll(/^# Subtest: selection:(.+)$/gm)].map((m) => m[1]);
    assert.ok(selected.length > 0, result.stderr || result.stdout);
    assert.equal(result.status, failingFile && selected.includes(failingFile) ? 1 : 0, result.stderr || result.stdout);
    return { shard, exit_code: result.status, files: selected };
  });
  const all = shards.flatMap((shard) => shard.files);
  assert.equal(new Set(all).size, all.length, "No duplicated file");
  assert.deepEqual(all.sort(), [...files].sort(), "No omitted file");
  return shards;
}
const positive = partition();
marker(files[0], true);
const negative = partition(files[0]);
assert.equal(negative.filter((shard) => shard.exit_code !== 0).length, 1);
console.log(JSON.stringify({
  boundary: "Native selection probe with synthetic markers, not database execution or CI acceptance",
  baseline, node: process.version,
  workflow_sha256_lf: createHash("sha256").update(workflow).digest("hex"),
  selected_file_count: files.length, positive, negative,
  result: "All original files execute exactly once; the deliberately failing marker fails its shard."
}, null, 2));
