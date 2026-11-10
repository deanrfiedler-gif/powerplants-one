import assert from "node:assert/strict";
import { after, test } from "node:test";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { recoverSchema } from "../helpers/recover-schema";
import { localConfig } from "../../src/platform/config";
import { financeDraft, base } from "../helpers/finance";
import {
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import { readFinance } from "../../src/finance/reads";
import { readOperation } from "../../src/shared/receipts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
after(closeDatabase);
test("B3 populated 0125 Finance upgrade preserves processed WorkOrder records, exact receipts and allocations", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(125);
  await seed(125);
  const f = await financeDraft();
  const handoff = async () =>
    (
      await database().query("SELECT * FROM ppo.finance_handoffs WHERE id=$1", [
        f.id,
      ])
    ).rows[0];
  let h = await handoff();
  await submitFinance(f.p, f.id, { ...base(), expected_version: h.version });
  h = await handoff();
  const r = (
    await database().query("SELECT * FROM ppo.finance_revisions WHERE id=$1", [
      h.current_revision_id,
    ])
  ).rows[0];
  await reviewFinance(f.reviewer, f.id, {
    ...base(),
    expected_version: h.version,
    revision_id: r.id,
    source_hash: r.source_hash,
    decision: "Approved",
  });
  h = await handoff();
  await beginFinanceProcessing(f.processor, f.id, {
    ...base(),
    expected_version: h.version,
    scenario: "Accepted",
  });
  h = await handoff();
  await recordFinanceOutcome(f.processor, f.id, {
    ...base(),
    expected_version: h.version,
    attempt_id: h.active_attempt_id,
    action: "Dispatch",
  });
  h = await handoff();
  const o = (
    await database().query(
      "SELECT * FROM ppo.finance_outcomes WHERE handoff_id=$1",
      [f.id],
    )
  ).rows[0];
  await reconcileFinance(f.reconciler, f.id, {
    ...base(),
    expected_version: h.version,
    outcome_id: o.id,
    basis: "SYN exact original WorkOrder target reconciliation",
  });
  const tables = [
    "finance_handoffs",
    "finance_revisions",
    "finance_lines",
    "finance_sources",
    "finance_allocation_holds",
    "finance_reviews",
    "finance_processing_attempts",
    "finance_simulator_targets",
    "finance_simulator_results",
    "finance_outcomes",
    "finance_reconciliations",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
    "permission_grants",
    "seed_receipts",
  ];
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        tables.map(async (t) => [
          t,
          (
            await database().query(
              `SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
            )
          ).rows.map((x) => x.row),
        ]),
      ),
    );
  const before = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  await seed();
  const after = await snapshot();
  for (const t of tables) {
    assert.equal(after[t].length, before[t].length, t);
    for (const original of before[t]) {
      const current = after[t].find((x: Record<string, unknown>) =>
        Object.entries(original).every(
          ([k, v]) => JSON.stringify(x[k]) === JSON.stringify(v),
        ),
      );
      assert.ok(current, `preserved every original ${t} field`);
    }
  }
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations WHERE version<=125 ORDER BY version",
      )
    ).rows,
    ledger,
  );
  const current = await readFinance(f.p, f.id);
  assert.equal(current.handoff.source_kind, "WorkOrder");
  assert.equal(current.handoff.status, "Reconciled");
  assert.ok(current.lines.every((x) => x.claim_basis_id === null));
  assert.equal(current.readiness.ready, true);
  assert.deepEqual(
    await readOperation(f.p, f.cmd.operation_id),
    f.result.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), after);
});
