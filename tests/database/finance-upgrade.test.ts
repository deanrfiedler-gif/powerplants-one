import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createHash } from "node:crypto";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import {
  readQuoteJob,
  runQuoteJob,
  draftBytes,
} from "../../src/estimating/worker";
import { readOperation } from "../../src/shared/receipts";
import { crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
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
    issue = (
      await database().query("SELECT * FROM ppo.report_issues WHERE id=$1", [
        q.report.issues[0].id,
      ])
    ).rows[0],
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
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
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

test("P10 arrival after already-applied E1 0012 retains exact estimating originals, output, receipts and revoked grants", async () => {
  await transaction(async (c) => {
    await c.query(
      await readFile(
        new URL("../../db/migrations/0001-recover.sql", import.meta.url),
        "utf8",
      ),
    );
    await c.query("DROP TABLE public.ppo_migrations");
  });
  await migrate(10);
  await seed(10);
  // Reproduce actual merged E1 main: 0012 was applied while reserved 0011 was absent.
  await transaction(async (c) => {
    const sql = await readFile(
      new URL("../../db/migrations/0012-estimating-e1.sql", import.meta.url),
      "utf8",
    );
    await c.query(sql);
    await c.query(
      "INSERT INTO public.ppo_migrations(version,sha256) VALUES(12,$1)",
      [createHash("sha256").update(sql).digest("hex")],
    );
    await c.query(
      await readFile(
        new URL("../../db/seed-estimating-e1.sql", import.meta.url),
        "utf8",
      ),
    );
    await c.query("INSERT INTO ppo.seed_receipts(version) VALUES(12)");
  });
  const p = await principal("coordinator"),
    o = crmCreate();
  await createOpportunity(p, o);
  const input = estimateInput(o.id),
    accepted = await createEstimate(p, input),
    e = await readEstimate(p, input.id),
    q = quoteCommand(e.saved);
  await prepareQuote(p, e.id, q);
  await runQuoteJob((await readQuoteJob(p, q.id)).j.id);
  const bytes = await draftBytes(p, q.id),
    tables = [
      "estimates",
      "estimate_versions",
      "draft_quotes",
      "draft_quote_revisions",
      "estimate_quote_jobs",
      "estimate_quote_attempts",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
    ];
  const originals = async () =>
    Promise.all(
      tables.map(
        async (t) =>
          (
            await database().query(
              `SELECT to_jsonb(t) value FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
            )
          ).rows,
      ),
    );
  const before = await originals(),
    hashes = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [p.actor_id],
  );
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await originals(), before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations WHERE version<=12 AND version<>11 ORDER BY version",
      )
    ).rows,
    hashes,
  );
  assert.deepEqual(await draftBytes(p, q.id), bytes);
  assert.equal((await readEstimate(p, e.id)).can_edit, false);
  await assert.rejects(
    readOperation(p, input.operation_id),
    (error: unknown) =>
      (error as { code: string }).code === "RecordUnavailable",
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT result FROM ppo.operation_receipts WHERE operation_id=$1",
        [input.operation_id],
      )
    ).rows[0].result,
    accepted.receipt,
  );
  assert.equal(
    (await financeOptions(await principal("finance"))).accounts.length > 0,
    true,
  );
  assert.equal(
    (await database().query("SELECT count(*)::int n FROM ppo.finance_handoffs"))
      .rows[0].n,
    0,
  );
});
