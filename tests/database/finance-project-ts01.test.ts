import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  projectFinanceFixture,
  saveClaim,
  approveClaim,
  crmBase,
  readFinance,
} from "../helpers/project-claim-finance";
import {
  linkedFinanceDraft,
  reviseWork,
  costLines,
  submitWork,
  reviewWork,
  beginWork,
  recordWork,
  reconcileWork,
} from "../helpers/project-work-finance";
import { commandCommercial } from "../../src/projects/commercial/commands";
import { commercialAction, variation } from "../helpers/project-commercial";
import { commandClaims } from "../../src/projects/commercial/claims";
import {
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import { readCommercialFinance } from "../../src/projects/commercial/reads";
import {
  contextFixture,
  seedStage,
  act,
  PJ,
  stable,
} from "../helpers/acceptance";
import { finishStage } from "../helpers/acceptance-journey";
import { verifyConnectedMaintenanceBilling } from "../helpers/connected-maintenance-billing";
import { verifyClaimEvidence } from "../helpers/claim-finance-evidence";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("B4/M2/C1 connected Finance component: project claims, separate agreement fee and covered six-monthly work reconcile without double billing", async () => {
  const f = await projectFinanceFixture(true);
  const work = await linkedFinanceDraft(f.project.id);
  await assert.rejects(
    submitWork(work),
    (e: unknown) => (e as { code: string }).code === "ProjectWorkNotBillable",
  );
  await reviseWork(work, costLines(work));
  await submitWork(work);
  await reviewWork(work);
  await beginWork(work);
  await recordWork(work);
  await reconcileWork(work);
  const w = await readFinance(work.reconciler, work.id);
  assert.equal(w.handoff.status, "Reconciled");
  assert.equal(w.reconciliations[0].result, "NoPostingRequired");
  assert.equal(w.targets.length, 0);
  assert.ok(w.lines.every((l) => l.disposition === "NonBillable"));
  const v = variation(f.commercial, "5180.00", "5180.00");
  await commandCommercial(f.owner, f.project.id, v);
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(v.id, 1, "Submit"),
  );
  await commandCommercial(f.commercial.reviewer, f.project.id, {
    ...commercialAction(v.id, 2, "Decide"),
    outcome: "Approved",
  });
  await commandClaims(f.owner, f.project.id, {
    ...f.action(7, "RecordEvidence"),
    completion: {
      ...f.completion(0),
      kind: "Variation",
      target_id: v.id,
      target_version: 3,
    },
  });
  const claim = await saveClaim(f, [4, 5, 6, 7, 8]);
  await approveClaim(f, claim.id);
  let r = await readFinance(f.processor, claim.id);
  await beginFinanceProcessing(f.processor, claim.id, {
    ...crmBase(),
    expected_version: r.handoff.version,
    scenario: "Accepted",
  });
  r = await readFinance(f.processor, claim.id);
  await recordFinanceOutcome(f.processor, claim.id, {
    ...crmBase(),
    expected_version: r.handoff.version,
    attempt_id: r.handoff.active_attempt_id,
    action: "Dispatch",
  });
  r = await readFinance(f.reconciler, claim.id);
  assert.deepEqual(
    r.lines.map((l) => l.claim_amount).sort(),
    ["38973.00", "51964.00", "25982.00", "12991.00", "5180.00"].sort(),
  );
  assert.equal(
    r.lines.filter((l) => l.claim_kind === "Variation")[0].claim_target_id,
    v.id,
  );
  assert.equal(r.targets.length, 1);
  assert.ok(
    r.lines.every(
      (l) => l.claim_currency === "AUD" && l.claim_tax_basis === "ExcludingTax",
    ),
  );
  // Existing acceptance helpers create explicit synthetic gate evidence. Preserve
  // the commercial project/customer and add the synthetic recipient relationship.
  await contextFixture(f.project.id);
  await database().query(
    "INSERT INTO ppo.relationships(id,workspace_id,company_id,organisation_id,person_id,role_label,valid_from,created_by,updated_by) VALUES($1,$2,$3,$4,$5,'ProjectContact','2026-01-01',$6,$6)",
    [
      stable("b4-ts01-recipient"),
      f.owner.workspace_id,
      f.project.company_id,
      f.project.organisation_id,
      PJ.person,
      f.owner.actor_id,
    ],
  );
  const stage = await seedStage(
    f.project.id,
    "TS01",
    "SYN TS-01 complete acceptance stage",
  );
  const closed = await finishStage(f.project.id, stage.stage);
  await act("finance-reviewer", f.project.id, null, "commercial", {
    source_id: closed.requirements.find((x) => x.gate === "Commercial")!.source
      .id,
    outcome: "Complete",
    evidence: "SYN independent whole-project commercial closeout",
  });
  await act("coordinator", f.project.id, null, "closeProject");
  assert.equal(
    (
      await database().query("SELECT lifecycle FROM ppo.projects WHERE id=$1", [
        f.project.id,
      ])
    ).rows[0].lifecycle,
    "Closed",
  );
  // Only reconciliation follows closure; new claims still require Active.
  await reconcileFinance(f.reconciler, claim.id, {
    ...crmBase(),
    expected_version: r.handoff.version,
    outcome_id: r.outcomes[0].id,
    basis:
      "SYN exact five claim amounts and frozen target lines independently compared after native closeout",
  });
  r = await readFinance(f.reconciler, claim.id);
  assert.equal(r.handoff.status, "Reconciled");
  assert.equal(r.reconciliations[0].result, "Matched");
  const finance = await readCommercialFinance(f.reconciler, f.project.id);
  const measures = finance.claim_measures;
  assert.ok(measures);
  assert.equal(finance.original_control_value, "129910.00");
  assert.equal(finance.approved_change_value, "5180.00");
  assert.equal(finance.adjusted_control_value, "135090.00");
  assert.deepEqual(
    measures.by_state.map((x) => [x.status, x.amount]),
    [["Reconciled", "135090.00"]],
  );
  assert.deepEqual(
    measures.allocations.map((x) => [x.state, x.amount]),
    [["Consumed", "135090.00"]],
  );
  assert.equal(
    measures.erp_basis,
    "Processed per recorded synthetic ERP outcome; not revenue, invoiced value or cash",
  );
  assert.deepEqual(
    [measures.billed_value, measures.cash_received, measures.open_receivable],
    [null, null, null],
  );
  await verifyConnectedMaintenanceBilling(f);
  await verifyClaimEvidence(f.reconciler, claim.id, "ProjectClaim", "135090.00");
  // The separate fee and covered visit must not change project entitlements.
  assert.deepEqual(
    (await readCommercialFinance(f.reconciler, f.project.id)).claim_measures,
    measures,
  );
});
