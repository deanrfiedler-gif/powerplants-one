import assert from "node:assert/strict";
import { after, test } from "node:test";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readRun, readRelease } from "../../src/cpq/reads";
import { readOperation } from "../../src/shared/receipts";
import { qualityActors, qualityEstimate } from "../helpers/cpq-quality";
import {
  publishCosts,
  reviewedCost,
  costDefinition,
} from "../helpers/cpq-costs";
import { publishedFixture } from "../helpers/cpq-packages";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
const rows = async (sql: string) => (await database().query(sql)).rows;
const snapshot = async () => {
  const tables = [
    "cpq_runs",
    "cpq_adoptions",
    "cpq_reviews",
    "cpq_activations",
    "cpq_releases",
    "estimates",
    "estimate_versions",
    "cost_sources",
    "cost_source_revisions",
    "cost_source_events",
    "business_identities",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  return Object.fromEntries(
    await Promise.all(
      tables.map(async (t) => [
        t,
        await rows(
          // Later seeds 107 (readiness), 108 (Conversations) and 110 (agent ask) are proved in readiness-gate.test.ts, conversations-upgrade.test.ts and assistant-upgrade.test.ts.
          `SELECT to_jsonb(x) value FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version NOT IN (107,108,110)" : t === "permission_grants" ? " WHERE x.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(x)::text`,
        ),
      ]),
    ),
  );
};
test("populated 0101 upgrade preserves exact CPQ/cost/adoption histories, original ledgers and receipts; repeat migration/seeding adds nothing", async () => {
  await recoverSchema();
  await rows("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(101);
  await seed(101);
  const actors = await qualityActors(),
    d = costDefinition([
      await reviewedCost(actors.p),
      await reviewedCost(actors.p, "hour", "40"),
    ]);
  const release = await publishCosts(actors, d),
    estimate = await qualityEstimate(actors.p);
  const run = await readRun(actors.p, estimate.calculation.run.id),
    before = await snapshot(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  const revisions = await rows(
    "SELECT to_jsonb(r) value FROM ppo.cpq_revisions r ORDER BY id",
  );
  await migrate();
  assert.deepEqual(await snapshot(), before);
  const after = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(after.slice(0, ledger.length), ledger);
  assert.deepEqual(
    after.slice(ledger.length).map((r) => r.version),
    [102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119],
  );
  assert.deepEqual(
    await rows(
      "SELECT to_jsonb(r)-'package_manifest' value FROM ppo.cpq_revisions r ORDER BY id",
    ),
    revisions,
  );
  assert.equal(
    (await readRelease(actors.p, release.release.id)).current.package_manifest,
    null,
  );
  assert.deepEqual(await readRun(actors.p, run.id), run);
  assert.deepEqual(
    await readOperation(actors.p, estimate.command.operation_id),
    estimate.receipt.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    after,
  );
  const pkg = await publishedFixture(actors, d);
  assert.equal(pkg.view.package.state, "Published");
});
