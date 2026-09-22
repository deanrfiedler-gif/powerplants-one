// Opt-in synthetic service measurements. Count SQL calls, never SQL text/values.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import pg from "pg";
import { localConfig } from "../src/platform/config.ts";
import { closeDatabase } from "../src/platform/database.ts";
import {
  fertigationFixture,
  fertigationBase,
  saveCommand,
} from "../tests/helpers/fertigation.ts";
import { largeFertigationScope } from "../tests/helpers/fertigation-large.ts";
import {
  createScope,
  saveScope,
} from "../src/estimating/fertigation/service.ts";
import { readScope } from "../src/estimating/fertigation/reads.ts";
import { validateScope } from "../src/estimating/fertigation/validation.ts";
import { calculate } from "../src/estimating/fertigation/engine.ts";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
const originalQuery = pg.Client.prototype.query;
let sample = null;
pg.Client.prototype.query = function (...args) {
  if (sample) sample.sql_calls++;
  return Reflect.apply(originalQuery, this, args);
};
const measurements = [];
async function measure(name, work) {
  assert.equal(sample, null);
  const current = { name, sql_calls: 0, duration_ms: 0 };
  sample = current;
  const started = performance.now();
  try {
    return await work();
  } finally {
    current.duration_ms = Math.round((performance.now() - started) * 100) / 100;
    measurements.push(current);
    sample = null;
  }
}
try {
  const fixture = await fertigationFixture();
  const proposal = largeFertigationScope();
  const input = {
    ...fixture.create,
    ...fertigationBase(),
    id: randomUUID(),
    name: proposal.name,
    proposal,
  };
  await measure("large validation", () => validateScope(proposal));
  await measure("large deterministic calculation", () => calculate(proposal));
  await measure("large create; warm database pool", () =>
    createScope(fixture.p, input),
  );
  const detail = await measure("large read; warm database pool", () =>
    readScope(fixture.p, input.id),
  );
  assert.equal(detail.revision.proposal.valves.length, 1000);
  const change = saveCommand(detail);
  change.proposal.valves[0].label = "SYN capacity successor";
  await measure("large successor save; warm database pool", () =>
    saveScope(fixture.p, input.id, change),
  );
  await closeDatabase();
  const cold = await measure("large read; newly opened database pool", () =>
    readScope(fixture.p, input.id),
  );
  assert.equal(
    cold.revision.proposal.valves[0].label,
    "SYN capacity successor",
  );
  await measure("typical one-valve read; warm database pool", () =>
    readScope(fixture.p, fixture.create.id),
  );
  await measure("rejected oversized graph; before database work", async () => {
    const oversized = {
      ...change,
      ...fertigationBase(),
      proposal: { ...proposal, name: "x".repeat(2_097_153) },
    };
    await assert.rejects(
      saveScope(fixture.p, input.id, oversized),
      (error) =>
        error.code === "InvalidData" &&
        JSON.stringify(error.field_errors).includes("2 MiB"),
    );
  });
  assert.equal(measurements.at(-1).sql_calls, 0);
  const result = {
    synthetic: true,
    scope:
      "Single sequential service calls on the isolated test database. SQL counts include authority, transaction and receipt statements; fixture setup and HTTP identity resolution are excluded. New pool is not a cold operating-system/PostgreSQL cache. Timings are individual samples, not percentiles.",
    node: process.version,
    platform: process.platform,
    fixture: {
      areas: proposal.areas.length,
      valves: proposal.valves.length,
      groups: proposal.groups.length,
      proposal_bytes: Buffer.byteLength(JSON.stringify(proposal)),
      read_bytes: Buffer.byteLength(JSON.stringify(detail)),
    },
    measurements,
  };
  await mkdir("verification-evidence/fertigation-capacity", {
    recursive: true,
  });
  await writeFile(
    "verification-evidence/fertigation-capacity/service-measurements.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  pg.Client.prototype.query = originalQuery;
  await closeDatabase();
}
