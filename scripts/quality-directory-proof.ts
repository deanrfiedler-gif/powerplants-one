import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { createSession } from "../src/platform/identity";
import { readDirectory } from "../src/crm/directory";
import { qualityLoadFixture } from "./quality-load-fixture";
import { performanceFixtureFingerprint } from "./quality-performance-fixture";

// A bounded query comparison, separate from PT-27 browser navigation latency.
// Uses the actual read implementation and preserves output/permission parity.
assert.equal(localConfig().database_name, "ppo_synthetic_test");
const mode = process.argv[2];
assert.ok(mode === "baseline" || mode === "candidate");
const root = "verification-evidence/directory-quality";
await mkdir(root, { recursive: true });
if (mode === "baseline") await qualityLoadFixture();
const fingerprint = await performanceFixtureFingerprint();
const baseline =
  mode === "candidate"
    ? JSON.parse(await readFile(`${root}/baseline.json`, "utf8"))
    : null;
if (baseline)
  assert.deepEqual(
    fingerprint,
    baseline.fixture,
    "The same retained load fixture must be used",
  );
const sourceHash = createHash("sha256")
  .update(await readFile("src/crm/directory.ts"))
  .digest("hex");
const outputHash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const cases = [
  { kind: "organisations", sort: "name" },
  { kind: "organisations", sort: "name", direction: "desc", page: 2 },
  { kind: "organisations", sort: "sites", direction: "desc" },
  { kind: "organisations", sort: "facilities", direction: "desc" },
  { kind: "organisations", sort: "deals", direction: "desc" },
  {
    kind: "organisations",
    q: "PT-27 customer 9",
    mine: "true",
    status: "Active",
  },
  { kind: "organisations", q: "absent synthetic customer" },
  { kind: "people", sort: "name" },
  { kind: "people", sort: "deals", direction: "desc" },
  { kind: "people", q: "SYN" },
];
const comparisons: unknown[] = [];
for (const profile of ["coordinator", "second-company"]) {
  const p = (await createSession(profile)).principal;
  for (const input of cases) {
    const start = performance.now();
    const { observed_at: _, ...result } = await readDirectory(p, input);
    void _;
    const record = {
      profile,
      input,
      output_sha256: outputHash(result),
      total: result.total,
      rows: result.items.length,
    };
    comparisons.push(record);
    console.log(
      JSON.stringify({
        phase: "parity",
        profile,
        input,
        elapsed_ms: performance.now() - start,
      }),
    );
  }
}
if (baseline)
  assert.deepEqual(
    comparisons,
    baseline.comparisons,
    "Exact authorised totals, order, counts and page content must remain equal",
  );
const p = (await createSession("coordinator")).principal;
const { observed_at: expectedObservedAt, ...expected } = await readDirectory(
  p,
  { kind: "organisations" },
);
void expectedObservedAt;
const expectedHash = outputHash(expected);
const samples: {
  wave: number;
  user: number;
  elapsed_ms: number;
  output_sha256: string;
}[] = [];
for (let wave = 0; wave < 4; wave++) {
  await Promise.all(
    Array.from({ length: 10 }, async (_, user) => {
      const at = performance.now();
      const { observed_at: observedAt, ...result } = await readDirectory(p, {
        kind: "organisations",
      });
      void observedAt;
      const elapsed_ms = performance.now() - at;
      const output_sha256 = outputHash(result);
      assert.equal(
        output_sha256,
        expectedHash,
        "Every timed sample must retain the exact authorised page",
      );
      samples.push({ wave, user, elapsed_ms, output_sha256 });
    }),
  );
}
const durations = samples.map((s) => s.elapsed_ms).sort((a, b) => a - b);
const after = await performanceFixtureFingerprint();
assert.deepEqual(
  after,
  fingerprint,
  "Measurement must not change the load fixture",
);
const proof = {
  captured_at: new Date().toISOString(),
  mode,
  source_head: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  source_sha256: sourceHash,
  database: (await database().query("SELECT version() AS engine")).rows[0]
    .engine,
  fixture: fingerprint,
  fixture_after: after,
  comparisons,
  samples: samples.sort((a, b) => a.wave - b.wave || a.user - b.user),
  summary: {
    count: durations.length,
    p50_ms: durations[19],
    p95_ms: durations[37],
    max_ms: durations[39],
  },
  limits:
    "Read-service timing on one Windows host, ten concurrent calls over four waves. Includes capability and permission-scoped SQL and output parsing. Excludes HTTP, browser rendering, network throttling and hosted infrastructure. Ordered baseline/candidate share database/OS caches. No PT-27 target attainment is inferred.",
};
await writeFile(`${root}/${mode}.json`, JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof.summary));
await closeDatabase();
