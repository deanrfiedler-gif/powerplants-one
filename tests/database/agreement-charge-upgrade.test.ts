import assert from "node:assert/strict";
import { after, test } from "node:test";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { recoverSchema } from "../helpers/recover-schema";
import {
  projectFinanceFixture,
  saveClaim,
  approveClaim,
} from "../helpers/project-claim-finance";
import { agreement } from "../helpers/maintenance";
import { readFinance } from "../../src/finance/reads";
import { readOperation } from "../../src/shared/receipts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
after(closeDatabase);
test("C1 populated 0126 upgrade retains exact agreement bytes, ProjectClaim holds, receipts and grants", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(126);
  await seed(126);
  const oldAgreement = await agreement(),
    f = await projectFinanceFixture(),
    a = await saveClaim(f, [4]);
  await approveClaim(f, a.id);
  const tables = [
    "service_agreements",
    "agreement_revisions",
    "agreement_scope",
    "maintenance_events",
    "finance_handoffs",
    "finance_revisions",
    "finance_lines",
    "finance_allocation_holds",
    "finance_reviews",
    "audit_events",
    "operation_receipts",
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
              `SELECT to_jsonb(x) AS row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
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
  const additions: Record<string, Record<string, unknown>> = {
    finance_handoffs: { agreement_id: null },
    finance_lines: { agreement_revision_id: null, agreement_charge_id: null },
    finance_allocation_holds: {
      agreement_revision_id: null,
      agreement_charge_id: null,
    },
  };
  for (const t of tables) {
    const expected = before[t].map((r: Record<string, unknown>) => ({
      ...r,
      ...additions[t],
    }));
    assert.deepEqual(after[t], expected, t);
  }
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.agreement_charge_lines",
      )
    ).rows[0].n,
    "0",
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations WHERE version<=126 ORDER BY version",
      )
    ).rows,
    ledger,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT version FROM public.ppo_migrations WHERE version>126 ORDER BY version",
      )
    ).rows,
    [{ version: 127 }, { version: 128 }],
  );
  assert.equal(
    (await readFinance(f.preparer, a.id)).handoff.status,
    "Approved",
  );
  assert.deepEqual(
    await readOperation(f.preparer, a.cmd.operation_id),
    a.result.receipt,
  );
  assert.equal(
    "charge_schedule" in
      (
        await database().query(
          "SELECT content FROM ppo.agreement_revisions WHERE id=$1",
          [oldAgreement.revision],
        )
      ).rows[0].content,
    false,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), after);
});

async function at127() {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(127);
  await seed(127);
}
async function retainedGraph() {
  return Object.fromEntries(
    await Promise.all(
      [
        "service_agreements",
        "agreement_revisions",
        "agreement_charge_lines",
        "maintenance_events",
        "finance_handoffs",
        "finance_revisions",
        "finance_lines",
        "finance_allocation_holds",
        "finance_reviews",
        "finance_processing_attempts",
        "finance_outcomes",
        "finance_simulator_targets",
        "finance_reconciliations",
        "audit_events",
        "operation_receipts",
        "outbox_jobs",
        "permission_grants",
        "seed_receipts",
      ].map(async (t) => [
        t,
        (
          await database().query(
            `SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
          )
        ).rows,
      ]),
    ),
  );
}

test("C1-1 populated 0127 upgrade preserves consumed/unknown charges and original recovery", async () => {
  await at127();
  const {
    agreementChargeFixture,
    saveAgreementClaim,
    submitAgreementClaim,
    reviewAgreementClaim,
    beginAgreementClaim,
    outcomeAgreementClaim,
    reconcileAgreementClaim,
  } = await import("../helpers/agreement-charge-finance");
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f),
    b = await saveAgreementClaim(f, [f.second]);
  for (const [claim, scenario] of [
    [a, "Accepted"],
    [b, "AcceptedThenTimeout"],
  ] as const) {
    await submitAgreementClaim(f, claim.id);
    await reviewAgreementClaim(f, claim.id);
    await beginAgreementClaim(f, claim.id, scenario);
    await outcomeAgreementClaim(f, claim.id);
  }
  await reconcileAgreementClaim(f, a.id);
  const before = await retainedGraph(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await retainedGraph(), before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations WHERE version<=127 ORDER BY version",
      )
    ).rows,
    ledger,
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT version FROM public.ppo_migrations WHERE version>127 ORDER BY version",
      )
    ).rows,
    [{ version: 128 }],
  );
  await migrate();
  await seed();
  assert.deepEqual(await retainedGraph(), before);
  const { saveFinance } = await import("../../src/finance/service");
  assert.deepEqual(
    (await saveFinance(f.preparer, null, a.cmd)).receipt,
    a.result.receipt,
  );
  await outcomeAgreementClaim(f, b.id, "LookupOriginal");
  await reconcileAgreementClaim(f, b.id);
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.finance_simulator_targets WHERE kind='SyntheticAgreementCharge'",
      )
    ).rows[0].n,
    "2",
  );
  assert.equal(
    (await readFinance(f.reconciler, b.id)).handoff.status,
    "Processed",
  );
});

test("C1-1 0127 duplicate cross-revision history is reproduced and 0128 refuses atomically", async () => {
  await at127();
  const { randomUUID } = await import("node:crypto");
  const { agreementChargeFixture, saveAgreementClaim, base } =
    await import("../helpers/agreement-charge-finance");
  const { agreementCommand } = await import("../../src/maintenance/agreements");
  const { saveFinance } = await import("../../src/finance/service");
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  const revised = await agreementCommand(f.owner, f.id, {
    ...base(),
    expected_version: 2,
    action: "Revise",
    content: { ...f.content, title: "SYN old title amendment" },
  });
  await agreementCommand(f.reviewer, f.id, {
    ...base(),
    expected_version: revised.receipt.record_version,
    action: "Approve",
    authority_reference: "SYN prior schema approval",
  });
  const revision = (
    await database().query(
      "SELECT current_revision_id FROM ppo.service_agreements WHERE id=$1",
      [f.id],
    )
  ).rows[0].current_revision_id;
  const cmd = {
    ...f.draft(),
    id: randomUUID(),
    agreement_revision_id: revision,
  };
  await saveFinance(f.preparer, null, cmd);
  for (const id of [a.id, cmd.id]) {
    const r = await readFinance(f.preparer, id);
    await database().query(
      `INSERT INTO ppo.finance_allocation_holds(workspace_id,handoff_id,revision_id,line_id,agreement_revision_id,agreement_charge_id,quantity,state) VALUES($1,$2,$3,$4,$5,$6,1,'Held')`,
      [
        f.preparer.workspace_id,
        id,
        r.handoff.current_revision_id,
        r.lines[0].id,
        r.lines[0].agreement_revision_id,
        f.first,
      ],
    );
  }
  const before = await retainedGraph(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.finance_allocation_holds WHERE agreement_charge_id=$1 AND state='Held'",
        [f.first],
      )
    ).rows[0].n,
    "2",
  );
  await assert.rejects(
    migrate(),
    /Duplicate agreement charge entitlements require explicit reconciliation/,
  );
  assert.deepEqual(await retainedGraph(), before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    ledger,
  );
  assert.equal(
    (
      await database().query(
        "SELECT to_regprocedure('ppo.guard_reserved_agreement_charges()') name",
      )
    ).rows[0].name,
    null,
  );
});
