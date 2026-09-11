import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  approvedFinance,
  processedFinance,
  reconciledFinance,
  readFinance,
  base,
  rows,
} from "../helpers/finance";
import {
  beginFinanceProcessing,
  recordFinanceOutcome,
} from "../../src/finance/service";
import {
  requestFinanceEvidence,
  processFinanceJob,
  financeIssueBytes,
} from "../../src/finance/worker";
import { readOperation } from "../../src/shared/receipts";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
for (const state of ["Approved", "OutcomeUnknown", "Reconciled"]) {
  test(`P11 additive upgrade preserves actual current-main/P10 ${state} records, original outputs and revoked receipt grants`, async () => {
    await transaction(async (c) => {
      await c.query(
        await readFile(
          new URL("../../db/migrations/0001-recover.sql", import.meta.url),
          "utf8",
        ),
      );
      await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
    });
    // Exact unchanged current-main migrations/seeds through 0012; real domain
    // commands create originals in the original P10 definition, not copied rows.
    await migrate(12);
    await seed(12);
    const q =
      state === "Approved"
        ? await approvedFinance()
        : state === "OutcomeUnknown"
          ? await processedFinance("AcceptedThenTimeout")
          : await reconciledFinance();
    let issueId: string | undefined, bytes: Buffer | undefined;
    if (state === "Reconciled") {
      const d = await readFinance(q.reconciler, q.id);
      await requestFinanceEvidence(q.reconciler, q.id, {
        ...base(),
        expected_version: d.handoff.version,
        revision_id: d.handoff.current_revision_id,
        review_id: d.reviews[0].id,
        reconciliation_id: d.reconciliations[0].id,
      });
      const job = (
        await rows(
          "SELECT id FROM ppo.finance_render_jobs WHERE handoff_id=$1",
          [q.id],
        )
      )[0];
      await processFinanceJob(job.id);
      issueId = (
        await rows("SELECT id FROM ppo.finance_issues WHERE handoff_id=$1", [
          q.id,
        ])
      )[0].id;
      bytes = (
        await financeIssueBytes(q.reconciler, issueId!, { format: "pdf" })
      ).bytes;
    }
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.prepare'",
      [q.p.actor_id],
    );
    const tables = [
      "finance_definitions",
      "pack_templates",
      "report_templates",
      "finance_templates",
      "finance_handoffs",
      "finance_revisions",
      "finance_sources",
      "finance_lines",
      "finance_reviews",
      "finance_allocation_holds",
      "finance_processing_attempts",
      "finance_simulator_targets",
      "finance_simulator_results",
      "finance_outcomes",
      "finance_reconciliations",
      "finance_events",
      "finance_render_jobs",
      "finance_render_attempts",
      "finance_issues",
      "field_entries",
      "field_attachments",
      "report_revisions",
      "report_entry_refs",
      "report_reviews",
      "report_issues",
      "report_presentations",
      "attendance_acceptances",
      "audit_events",
      "operation_receipts",
      "outbox_jobs",
      "permission_grants",
    ];
    const originals = async () => {
      const result: Record<string, unknown> = {};
      for (const table of tables)
        result[table] = await rows(
          `SELECT to_jsonb(t) value FROM ppo.${table} t ${["finance_definitions", "pack_templates", "report_templates", "finance_templates"].includes(table) ? "WHERE version=1" : ""} ORDER BY to_jsonb(t)::text`,
        );
      return result;
    };
    const before = await originals(),
      migrations = await rows(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      );
    assert.equal(
      (await rows("SELECT version FROM ppo.finance_policy"))[0].version,
      1,
    );
    await migrate();
    await seed();
    await migrate();
    await seed();
    const afterUpgrade = await originals();
    const originalGrants = before.permission_grants as { value: Record<string, unknown> }[];
    const upgradedGrants = afterUpgrade.permission_grants as { value: Record<string, unknown> }[];
    const originalIds = new Set(originalGrants.map(g => g.value.id));
    // Every old grant remains byte-for-byte, including the deliberately revoked one.
    assert.deepEqual(upgradedGrants.filter(g => originalIds.has(g.value.id)), originalGrants);
    const added = upgradedGrants.filter(g => !originalIds.has(g.value.id));
    const expected = originalGrants.filter(g => g.value.user_id === "30000000-0000-4000-8000-000000000001" && g.value.capability === "shared.edit")
      .flatMap(g => ["email.read", "email.edit"].map(capability => ({ ...g.value, capability })));
    // The combined 0018 Leads / 0019 Projects / 0020 Engineering seeds add only these capabilities
    // to the two existing synthetic coordinator scopes. Keep an exact allowlist:
    // an unrelated new grant must fail, even if its scope matches an old grant.
    const coordinatorIds = new Set([
      "30000000-0000-4000-8000-000000000001",
      "30000000-0000-4000-8000-000000000008",
    ]);
    const coordinatorGrants = originalGrants.filter(g => coordinatorIds.has(String(g.value.user_id)));
    expected.push(
      ...coordinatorGrants.filter(g => g.value.capability === "crm.opportunity.edit")
        .flatMap(g => ["crm.lead.read", "crm.lead.create", "crm.lead.edit", "crm.lead.convert"]
          .map(capability => ({ ...g.value, capability }))),
      ...coordinatorGrants.filter(g => g.value.capability === "shared.edit")
        .flatMap(g => ["project.read", "project.create", "project.edit", "engineering.read", "engineering.create", "engineering.edit"]
          .map(capability => ({ ...g.value, capability }))),
    );
    const grantShape = (g: Record<string, unknown>) => Object.fromEntries(Object.entries(g).filter(([k]) => k !== "id"));
    const sorted = (gs: Record<string, unknown>[]) => gs.map(g => JSON.stringify(grantShape(g))).sort();
    assert.deepEqual(sorted(added.map(g => g.value)), sorted(expected));
    assert.deepEqual({ ...afterUpgrade, permission_grants: originalGrants }, before);
    assert.deepEqual(
      await rows(
        "SELECT * FROM public.ppo_migrations WHERE version<=12 ORDER BY version",
      ),
      migrations,
    );
    assert.deepEqual(
      await rows(
        "SELECT version FROM ppo.finance_definitions ORDER BY version",
      ),
      [{ version: 1 }, { version: 2 }],
    );
    assert.equal(
      (await rows("SELECT version FROM ppo.finance_policy"))[0].version,
      2,
    );
    const d = await readFinance(q.processor, q.id);
    assert.equal(d.handoff.status, state);
    assert.equal(d.readiness.code, "FinancePolicyChanged");
    await assert.rejects(
      readOperation(q.p, q.cmd.operation_id),
      code("Forbidden"),
    );
    if (state === "Approved")
      await assert.rejects(
        beginFinanceProcessing(q.processor, q.id, {
          ...base(),
          expected_version: d.handoff.version,
          scenario: "Accepted",
        }),
        code("FinancePolicyChanged"),
      );
    if (state === "OutcomeUnknown") {
      const targets = await rows(
        "SELECT * FROM ppo.finance_simulator_targets ORDER BY id",
      );
      await recordFinanceOutcome(q.processor, q.id, {
        ...base(),
        expected_version: d.handoff.version,
        attempt_id: d.handoff.active_attempt_id,
        action: "LookupOriginal",
      });
      assert.equal(
        (await readFinance(q.processor, q.id)).handoff.status,
        "ReconciliationRequired",
      );
      assert.deepEqual(
        await rows("SELECT * FROM ppo.finance_simulator_targets ORDER BY id"),
        targets,
      );
      assert.equal(targets.length, 1);
    }
    if (issueId)
      assert.deepEqual(
        (await financeIssueBytes(q.reconciler, issueId, { format: "pdf" }))
          .bytes,
        bytes,
      );
    await database().query("UPDATE ppo.finance_policy SET version=version+1");
    await seed();
    assert.equal(
      (await rows("SELECT version FROM ppo.finance_policy"))[0].version,
      3,
    );
  });
}
