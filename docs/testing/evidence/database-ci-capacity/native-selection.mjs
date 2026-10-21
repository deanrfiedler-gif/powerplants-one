// Run from the repository root. This executes synthetic markers, never database tests.
// The actual pinned Node runner must select every discovered filename exactly once.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

mkdirSync("tmp", { recursive: true });
const fixture = mkdtempSync(join("tmp", "db-selection-"));
const directory = join(fixture, "tests/database");
mkdirSync(directory, { recursive: true });
writeFileSync(join(fixture, "package.json"), '{"type":"module"}\n');
const files = readdirSync("tests/database").filter((name) => name.endsWith(".test.ts")).sort();
function marker(name, fail = false) {
  writeFileSync(join(directory, name), `import test from "node:test";\ntest(${JSON.stringify(`discovery:${name}`)}, () => { ${fail ? 'throw new Error("intentional discovery negative control");' : ""} });\n`);
}
files.forEach((name) => marker(name));

function partition(names, count, failingFile) {
  const shards = [];
  for (let index = 1; index <= count; index++) {
    // Markers are plain JavaScript in .ts files, supported by Node 24 directly.
    // Selection precedes loading; avoid hundreds of unnecessary tsx startups.
    // The separate whole-workflow check preserves the real CI command's loader.
    const args = ["--test", "--test-reporter=tap", "--test-concurrency=1", "--test-timeout=120000", `--test-shard=${index}/${count}`, ...names.map((name) => `tests/database/${name}`)];
    const result = spawnSync(process.execPath, args, { cwd: fixture, encoding: "utf8", timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
    assert.ifError(result.error);
    const selected = [...result.stdout.matchAll(/^# Subtest: discovery:(.+)$/gm)].map((match) => match[1].trim());
    assert.ok(selected.length > 0, result.stderr || result.stdout);
    assert.equal(result.status, failingFile && selected.includes(failingFile) ? 1 : 0, result.stderr || result.stdout);
    shards.push({ shard: `${index}/${count}`, exit_code: result.status, files: selected });
  }
  const flattened = shards.flatMap((shard) => shard.files);
  assert.equal(new Set(flattened).size, flattened.length, "No filename may occur twice");
  assert.deepEqual(flattened.sort(), names, "Every discovered filename must occur exactly once");
  return shards;
}

const previous = partition(files, 4);
const current = partition(files, 8);
for (let index = 0; index < 4; index++) {
  assert.deepEqual([...current[index].files, ...current[index + 4].files].sort(), previous[index].files,
    "Each original lane must split into exactly two subsets");
}
const added = "zz-synthetic-new-file.test.ts";
assert.ok(!files.includes(added));
marker(added, true);
const withNewFile = partition([...files, added].sort(), 8, added);
assert.equal(withNewFile.filter((shard) => shard.exit_code !== 0).length, 1);
console.log(JSON.stringify({
  node: process.version,
  boundary: "Synthetic native-runner file-selection proof only; no database behaviour is executed.",
  discovered_files: files.length,
  previous,
  current,
  new_file_negative_control: withNewFile,
  result: "All files selected exactly once; each old lane splits into two; a new failing file fails exactly one mandatory shard."
}, null, 2));
