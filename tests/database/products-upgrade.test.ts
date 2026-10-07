import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { migrationFiles, seedFiles } from "../../scripts/migration-registry";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { readOperation } from "../../src/shared/receipts";
import { crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { productInput } from "../helpers/products";
import { createProduct } from "../../src/products/commands";
import {
  assertOnlyEngineeringSeedGrantsAdded,
  productsSeedGrants,
  supplySeedGrants,
  schedulingPolicySeedGrants,
  incidentSeedGrants,
  estimateReviewSeedGrants,
  quotationReleaseSeedGrants,
} from "../helpers/engineering-materials-grants";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const rows = async (sql: string) => (await database().query(sql)).rows;
const shape = (rs: Record<string, unknown>[]) =>
  rs
    .map(({ id: _id, ...r }) => {
      void _id;
      return JSON.stringify(r);
    })
    .sort();
for (const through of [25, 48, 71, 72])
  test(`PD upgrade from ${through} preserves originals and exact new duties; repeat migration/seed is inert`, async () => {
    await database().query(
      await readFile(
        new URL("../../db/migrations/0001-recover.sql", import.meta.url),
        "utf8",
      ),
    );
    await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
    // Reproduce the actual pre-Products main registry, including its unfilled 0052 gap.
    const mi = migrationFiles.indexOf("0052-products-catalogue.sql"),
      si = seedFiles.findIndex(([v]) => v === 52);
    const [migration] = (migrationFiles as unknown as string[]).splice(mi, 1);
    const [fixture] = (seedFiles as unknown as [number, string][]).splice(
      si,
      1,
    );
    try {
      await migrate(through);
      await seed(through);
    } finally {
      (migrationFiles as unknown as string[]).splice(mi, 0, migration);
      (seedFiles as unknown as [number, string][]).splice(si, 0, fixture);
    }
    const p = (await createSession("coordinator")).principal,
      op = crmCreate();
    await createOpportunity(p, op);
    const input = estimateInput(op.id),
      created = await createEstimate(p, input),
      d = await readEstimate(p, input.id);
    await prepareQuote(p, input.id, quoteCommand(d.saved));
    const tables = [
      "estimates",
      "estimate_versions",
      "draft_quotes",
      "draft_quote_revisions",
      "operation_receipts",
    ];
    const snapshot = () =>
      Promise.all(
        tables.map((t) =>
          rows(`SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY id`),
        ),
      );
    const before = await snapshot(),
      grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
      ledger = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      );
    await migrate();
    await seed();
    assert.deepEqual(await snapshot(), before);
    assert.deepEqual(
      await readOperation(p, input.operation_id),
      created.receipt,
    );
    const after = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
      ids = new Set(grants.map((g) => g.id));
    assert.deepEqual(
      after.filter((g) => ids.has(g.id)),
      grants,
    );
    if (through === 25) assertOnlyEngineeringSeedGrantsAdded(grants, after);
    else
      assert.deepEqual(
        shape(after.filter((g) => !ids.has(g.id))),
        shape([
          ...productsSeedGrants(grants),
          ...(through === 48
            ? [
                ...supplySeedGrants(grants),
                ...schedulingPolicySeedGrants(grants),
                ...incidentSeedGrants(grants),
                ...estimateReviewSeedGrants(grants),
                ...quotationReleaseSeedGrants(grants),
              ]
            : []),
        ]),
      );
    const migrated = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      versions = new Set(ledger.map((r) => r.version));
    assert.deepEqual(
      migrated.filter((r) => versions.has(r.version)),
      ledger,
    );
    assert.equal(migrated.at(-1)?.version, 72);
    if (through >= 71)
      assert.deepEqual(
        migrated.filter((r) => !versions.has(r.version)).map((r) => r.version),
        through === 71 ? [52, 72] : [52],
      );
    const users = await rows("SELECT * FROM ppo.users ORDER BY id"),
      receipts = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
    await migrate();
    await seed();
    assert.deepEqual(
      await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
      after,
    );
    assert.deepEqual(await rows("SELECT * FROM ppo.users ORDER BY id"), users);
    assert.deepEqual(
      await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
      receipts,
    );
    assert.deepEqual(
      await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
      migrated,
    );
    assert.deepEqual(await snapshot(), before);
    await createProduct(
      (await createSession("products-author")).principal,
      productInput(),
    );
  });
