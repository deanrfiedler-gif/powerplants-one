// Run from the repository root. This proves file selection, not database behaviour.
// Synthetic markers retain the real filenames without importing application tests.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

mkdirSync("tmp", { recursive: true });
const fixture = mkdtempSync(join("tmp", "maintenance-shard-selection-"));
const directory = join(fixture, "tests/database");
mkdirSync(directory, { recursive: true });
writeFileSync(join(fixture, "package.json"), '{"type":"module"}\n');
const files = readdirSync("tests/database").filter((name) => name.endsWith(".test.ts")).sort();
function marker(name, fail = false) {
  writeFileSync(join(directory, name), `import test from "node:test";\ntest(${JSON.stringify(`discovery:${name}`)}, () => { ${fail ? 'throw new Error("intentional selection negative control");' : ""} });\n`);
}
files.forEach((name) => marker(name));

function partition(names, count, failingFile) {
  const shards = [];
  for (let index = 1; index <= count; index++) {
    const args = ["--import", "tsx", "--test", "--test-reporter=tap", "--test-concurrency=1", "--test-timeout=120000", `--test-shard=${index}/${count}`, ...names.map((name) => `tests/database/${name}`)];
    const result = spawnSync(process.execPath, args, { cwd: fixture, encoding: "utf8", timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    assert.ifError(result.error);
    const selected = [...result.stdout.matchAll(/^# Subtest: discovery:(.+)$/gm)].map((match) => match[1]);
    assert.ok(selected.length > 0, result.stderr || result.stdout);
    const expectedExit = failingFile && selected.includes(failingFile) ? 1 : 0;
    assert.equal(result.status, expectedExit, result.stderr || result.stdout);
    shards.push({ shard: `${index}/${count}`, exit_code: result.status, files: selected });
  }
  const flattened = shards.flatMap((shard) => shard.files);
  assert.equal(new Set(flattened).size, flattened.length, "No file may occur twice");
  assert.deepEqual(flattened.sort(), names, "Every discovered file must occur exactly once");
  return shards;
}

const previous = partition(files, 2);
const current = partition(files, 3);
const added = "zz-synthetic-new-file.test.ts";
assert.ok(!files.includes(added));
marker(added, true);
const withNewFile = partition([...files, added].sort(), 3, added);
assert.equal(withNewFile.filter((shard) => shard.exit_code !== 0).length, 1);
console.log(JSON.stringify({
  node: process.version,
  boundary: "Synthetic file-selection proof only; no database test or application behaviour is executed.",
  discovered_files: files.length,
  previous,
  current,
  new_file_negative_control: withNewFile,
  result: "Every original file selected once; a newly discovered failing file is selected once and produces a nonzero shard result."
}, null, 2));
