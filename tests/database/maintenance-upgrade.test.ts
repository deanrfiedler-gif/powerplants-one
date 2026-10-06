import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, transaction, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { migrationFiles, seedFiles, latestMigrationVersion } from "../../scripts/migration-registry";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { draftBytes, readQuoteJob, runQuoteJob } from "../../src/estimating/worker";
import { crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { principal, rows } from "../helpers/maintenance";
import { maintenanceSeedGrants } from "../helpers/engineering-materials-grants";
import { snapshot } from "../helpers/policy-commands";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
const read = (file: string) => readFile(new URL(`../../db/${file}`, import.meta.url), "utf8");

// Reconstruct the current-main gap from its original SQL, hashes and seed receipts.
// Do not pretend that a 0051 ledger row means the schema already exists.
async function currentMainWithoutMaintenance() {
  await rows(await read("migrations/0001-recover.sql"));
  await rows("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(50);
  await seed(50);
  await transaction(async (c) => {
    for (const file of migrationFiles.filter((f) => Number(f.slice(0, 4)) > 51)) {
      const sql = await read(`migrations/${file}`);
      await c.query(sql);
      await c.query("INSERT INTO public.ppo_migrations(version,sha256) VALUES($1,$2)",
        [Number(file.slice(0, 4)), createHash("sha256").update(sql).digest("hex")]);
    }
    for (const [version, file] of seedFiles.filter(([v]) => v > 51)) {
      await c.query(await read(file));
      await c.query("INSERT INTO ppo.seed_receipts(version) VALUES($1)", [version]);
    }
  });
  assert.equal((await rows("SELECT max(version) AS version FROM public.ppo_migrations"))[0].version, latestMigrationVersion);
  assert.equal((await rows("SELECT to_regclass('ppo.service_agreements') AS table"))[0].table, null);
}

test("late reserved Maintenance migration preserves the current schema, originals, outputs and exact grants", async () => {
  await currentMainWithoutMaintenance();
  const p = await principal(), opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const input = estimateInput(opportunity.id), accepted = await createEstimate(p, input);
  const estimate = await readEstimate(p, input.id), quote = quoteCommand(estimate.saved);
  await prepareQuote(p, estimate.id, quote);
  await runQuoteJob((await readQuoteJob(p, quote.id)).j.id);
  const bytes = await draftBytes(p, quote.id);
  assert.ok(bytes.pdf.length > 1000);
  const tables = (await rows("SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename"))
    .map((r: { tablename: string }) => r.tablename)
    .filter((name: string) => !["permission_grants", "seed_receipts"].includes(name));
  const before = await snapshot(tables), ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  const grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id");
  const seeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
  // Inspect the installed identity guard: later modules have extended this function.
  const identity = (await rows("SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) AS definition"))[0].definition;
  await migrate(); await seed();
  // 0051 adds an optional relationship; every existing value remains exact and the new field is null.
  const expected = { ...before, coverage_assessments: before.coverage_assessments.map(
    (row: Record<string, unknown>) => ({ ...row, entitlement_assessment_id: null }),
  ) };
  assert.deepEqual(await snapshot(tables), expected);
  assert.deepEqual(await rows("SELECT * FROM public.ppo_migrations WHERE version<>51 ORDER BY version"), ledger);
  assert.deepEqual(await rows("SELECT * FROM ppo.seed_receipts WHERE version<>51 ORDER BY version"), seeds);
  const actual = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"), ids = new Set(grants.map((g) => g.id));
  assert.deepEqual(actual.filter((g) => ids.has(g.id)), grants);
  const normal = (g: Record<string, unknown>) => Object.fromEntries(Object.entries(g).filter(([k]) => k !== "id"));
  const sorted = (g: Record<string, unknown>[]) => g.map(normal).map((r) => JSON.stringify(r, Object.keys(r).sort())).sort();
  assert.deepEqual(sorted(actual.filter((g) => !ids.has(g.id))), sorted(maintenanceSeedGrants(grants)));
  assert.equal(actual.length - grants.length, 22);
  const extended = (await rows("SELECT pg_get_functiondef('ppo.identity_has_typed_record()'::regprocedure) AS definition"))[0].definition;
  for (const branch of identity.match(/WHEN '[^']+'[^\n]*/g) ?? []) assert.ok(extended.includes(branch), branch);
  assert.match(extended, /ServiceAgreement/);
  assert.deepEqual(await draftBytes(p, quote.id), bytes);
  assert.deepEqual((await createEstimate(p, input)).receipt, accepted.receipt);
  const afterTables = await snapshot(tables), afterLedger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate(); await seed();
  assert.deepEqual(await snapshot(tables), afterTables);
  assert.deepEqual(await rows("SELECT * FROM public.ppo_migrations ORDER BY version"), afterLedger);
  assert.deepEqual(await rows("SELECT * FROM ppo.permission_grants ORDER BY id"), actual);
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='maintenance.manage'", [p.actor_id]);
  const revoked = await rows("SELECT * FROM ppo.permission_grants ORDER BY id");
  await seed();
  assert.deepEqual(await rows("SELECT * FROM ppo.permission_grants ORDER BY id"), revoked);
});
