import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reportIssued } from "../helpers/reports";
import { readReportBundle } from "../../src/reports/worker";
import { financeOptions, financeSources } from "../../src/finance/reads";
import { principal } from "../helpers/field";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
test("P10 additive upgrade from real P09 issued originals retains exact rows, bytes, migration checksums and repeat seeds", async () => {
  // A named disposable database is deliberately reconstructed at the P09 boundary.
  await transaction(async (c) => {
    await c.query(
      await readFile(
        new URL("../../db/migrations/0001-recover.sql", import.meta.url),
        "utf8",
      ),
    );
    await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  });
  await migrate(9);
  await seed(9);
  const q = await reportIssued();
  const tables = [
    "field_entries",
    "field_attachments",
    "completion_draft_revisions",
    "report_revisions",
    "report_entry_refs",
    "report_reviews",
    "report_issues",
    "report_presentations",
    "report_follow_ups",
    "field_attendances",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ];
  async function originals() {
    const snapshot: Record<string, unknown> = {};
    for (const table of tables)
      snapshot[table] = (
        await database().query(
          `SELECT to_jsonb(t) value FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
        )
      ).rows;
    return snapshot;
  }
  const before = await originals(),
    migrations = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    issue = q.report.issues[0],
    bytes = await readReportBundle(q.reviewer, issue.manifest);
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await originals(), before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations WHERE version<=9 ORDER BY version",
      )
    ).rows,
    migrations,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT version FROM public.ppo_migrations ORDER BY version",
      )
    ).rows.map((r) => r.version),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  );
  assert.deepEqual(await readReportBundle(q.reviewer, issue.manifest), bytes);
  assert.equal(
    (await database().query("SELECT count(*)::int n FROM ppo.finance_handoffs"))
      .rows[0].n,
    0,
  );
  const p = await principal("finance"),
    o = await financeOptions(p);
  const work = o.works.find(
    (w) => w.id === q.report.revisions[0].snapshot.work.id,
  )!;
  assert.equal(
    (await financeSources(p, work.id)).items.find((r) => r.id === q.report.id)!
      .ready,
    true,
  );
});
