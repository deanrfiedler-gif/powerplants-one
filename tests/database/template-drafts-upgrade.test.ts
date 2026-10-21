import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { queued } from "../helpers/packs";
import { readOperation } from "../../src/shared/receipts";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
test("R2 populated 0090 upgrade preserves exact output reservations, authority and ledgers; reapplication is inert", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(90);
  await seed(90);
  const q = await queued();
  const tables = [
    "pack_templates",
    "report_templates",
    "finance_templates",
    "pack_policy",
    "report_template_policy",
    "finance_template_policy",
    "pack_revisions",
    "pack_render_jobs",
    "pack_issues",
    "operation_receipts",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  const rows = async (sql: string) => (await database().query(sql)).rows;
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          // Later seeds 107 (readiness), 108 (Conversations) and 110 (agent ask) are proved in readiness-gate.test.ts, conversations-upgrade.test.ts and assistant-upgrade.test.ts.
          `SELECT to_jsonb(r) AS value FROM ppo.${t} r${t === "seed_receipts" ? " WHERE r.version NOT IN (107,108,110)" : t === "permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`,
        ),
      ),
    );
  const original = await snapshot(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  const afterLedger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    afterLedger.filter((r) => r.version <= 90),
    ledger,
  );
  assert.deepEqual(
    afterLedger.filter((r) => r.version > 90).map((r) => r.version),
    [91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 113, 114],
  );
  for (const table of [
    "template_proposals",
    "template_proposal_revisions",
    "template_proposal_reviews",
    "template_proposal_events",
  ])
    assert.deepEqual(await rows(`SELECT * FROM ppo.${table}`), []);
  assert.deepEqual(
    await rows(
      "SELECT id FROM ppo.permission_grants WHERE capability LIKE 'template.%'",
    ),
    [],
  );
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.receipt.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    afterLedger,
  );
});
