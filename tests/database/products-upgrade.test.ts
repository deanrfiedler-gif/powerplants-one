import { accessInspectionSeedGrants, accessRequestSeedGrants, accessApplicationSeedGrants, accessTeamSeedGrants, accessReviewSeedGrants, conversationSeedGrants, agentAskSeedGrants } from "../helpers/engineering-materials-grants";
import assert from "node:assert/strict";
import { test, after } from "node:test";
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
  maintenanceSeedGrants,
  supplySeedGrants,
  schedulingPolicySeedGrants,
  incidentSeedGrants,
  estimateReviewSeedGrants,
  quotationReleaseSeedGrants,
} from "../helpers/engineering-materials-grants";
import { recoverSchema } from "../helpers/recover-schema";
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
for (const through of [25, 48, 71, 72, 74, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118])
  test(`PD upgrade from ${through} preserves originals and exact new duties; repeat migration/seed is inert`, async () => {
    await recoverSchema();
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
    const earlierAdditions = after.filter(g => !ids.has(g.id) && g.capability !== "conversation.agent.ask");
    if (through === 25) assertOnlyEngineeringSeedGrantsAdded(grants, after);
    else
      assert.deepEqual(
        shape(earlierAdditions),
        shape(((others) => [...others, ...(through < 108 ? conversationSeedGrants([...grants, ...others]) : [])])([
          ...productsSeedGrants(grants),
          ...(through < 84 ? accessReviewSeedGrants(grants) : []),
          ...(through < 83 ? accessTeamSeedGrants(grants) : []),
          ...(through < 80 ? accessApplicationSeedGrants(grants) : []),
          ...(through < 79 ? accessRequestSeedGrants(grants) : []),
          ...(through < 78 ? accessInspectionSeedGrants(grants) : []),
          ...(through === 48
            ? [
                ...supplySeedGrants(grants),
                ...maintenanceSeedGrants(grants),
                ...schedulingPolicySeedGrants(grants),
                ...incidentSeedGrants(grants),
                ...estimateReviewSeedGrants(grants),
                ...quotationReleaseSeedGrants(grants),
              ]
            : []),
        ])),
      );
    assert.deepEqual(shape(after.filter(g => !ids.has(g.id) && g.capability === "conversation.agent.ask")),
      shape(through < 110 ? agentAskSeedGrants([...grants, ...earlierAdditions]) : []));
    const migrated = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      ),
      versions = new Set(ledger.map((r) => r.version));
    assert.deepEqual(
      migrated.filter((r) => versions.has(r.version)),
      ledger,
    );
    assert.equal(migrated.at(-1)?.version, 118);
    if (through >= 71)
      assert.deepEqual(
        migrated.filter((r) => !versions.has(r.version)).map((r) => r.version),
        through === 71
          ? [52, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118]
          : through === 72
            ? [52, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118]
            : through === 74
              ? [52, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118]
              : through === 76
                ? [52, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118]
                : through === 77 ? [52, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 78 ? [52, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 79 ? [52, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 80 ? [52, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 81 ? [52, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 82 ? [52, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 83 ? [52, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 84 ? [52, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 85 ? [52, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 86 ? [52, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 87 ? [52, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 88 ? [52, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 89 ? [52, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 90 ? [52, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 91 ? [52, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 92 ? [52, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 93 ? [52, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 94 ? [52, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 95 ? [52, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 96 ? [52, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 97 ? [52, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 98 ? [52, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 99 ? [52, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 100 ? [52, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 101 ? [52, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 102 ? [52, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 103 ? [52, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 104 ? [52, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 105 ? [52, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 106 ? [52, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 107 ? [52, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 108 ? [52, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 109 ? [52, 110, 111, 112, 113, 114, 115, 116, 117, 118] : through === 110 ? [52, 111, 112, 113, 114, 115, 116, 117, 118] : through === 111 ? [52, 112, 113, 114, 115, 116, 117, 118] : through === 112 ? [52, 113, 114, 115, 116, 117, 118] : through === 113 ? [52, 114, 115, 116, 117, 118] : through === 114 ? [52, 115, 116, 117, 118] : through === 115 ? [52, 116, 117, 118] : through === 116 ? [52, 117, 118] : through === 117 ? [52, 118] : [52],
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
