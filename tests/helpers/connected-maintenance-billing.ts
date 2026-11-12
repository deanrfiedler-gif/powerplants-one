import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import type { SourceEntry } from "../../src/finance/context";
import {
  createAgreement,
  agreementCommand,
} from "../../src/maintenance/agreements";
import { createPlan, planCommand } from "../../src/maintenance/plans";
import { prepareWork, receiveResult } from "../../src/maintenance/receiving";
import {
  agreementContent,
  planContent,
  assessment,
  asset,
  CRM,
  base,
  rows,
} from "./maintenance";
import { serviceResult } from "./maintenance-service";
import { timePayload, materialPayload } from "./field";
import { requestReportIssue, processReportJob } from "../../src/reports/worker";
import { readReport } from "../../src/reports/service";
import {
  financeOptions,
  financeSources,
  readFinance,
} from "../../src/finance/reads";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import type { projectFinanceFixture } from "./project-claim-finance";

// Continuation of the TS-01 Finance component, on the SAME company/customer.
// Dates are shifted to 2026 so the fee is due at execution; this does not execute
// the future-dated manual TS-01/TS-02 or assert operating prices/taxes.
export async function verifyConnectedMaintenanceBilling(
  f: Awaited<ReturnType<typeof projectFinanceFixture>>,
) {
  assert.equal(f.project.organisation_id, CRM.org);
  assert.equal(f.project.company_id, CRM.company);
  const agreementId = randomUUID(),
    chargeId = randomUUID();
  const content = {
    ...agreementContent(),
    effective_from: "2026-03-12",
    effective_to: "2027-03-11",
    charge_schedule: {
      currency: "AUD",
      tax_basis: "ExcludingTax",
      lines: [{ id: chargeId, due_date: "2026-03-12", amount: "4800.00" }],
    },
  };
  await createAgreement(f.owner, {
    ...base(),
    id: agreementId,
    company_id: CRM.company,
    customer_id: CRM.org,
    owner_id: CRM.owner,
    content,
  });
  await agreementCommand(f.reviewer, agreementId, {
    ...base(),
    expected_version: 1,
    action: "Approve",
    authority_reference: "SYN independent annual fee approval",
  });
  const agreement = (
    await rows("SELECT * FROM ppo.service_agreements WHERE id=$1", [
      agreementId,
    ])
  )[0];
  const options = await financeOptions(f.preparer);
  const common = {
    account_id: options.accounts.find((a) => a.customer_id === CRM.org)!.id,
    mode: "SyntheticApi",
    definition_id: options.definition.id,
    definition_version: options.definition.version,
    policy_version: options.definition.policy_version,
    treatment_basis:
      "SYN exact separate agreement fee and covered visit; no operational invoice",
  };
  const fee = {
    ...base(),
    ...common,
    id: randomUUID(),
    source_kind: "AgreementCharge",
    agreement_id: agreementId,
    agreement_revision_id: agreement.current_revision_id,
    charge_ids: [chargeId],
  };
  await saveFinance(f.preparer, null, fee);
  await process(f, fee.id);
  const billed = await readFinance(f.reconciler, fee.id);
  assert.equal(billed.reconciliations[0].result, "Matched");
  assert.equal(billed.targets.length, 1);
  assert.equal(billed.targets[0].kind, "SyntheticAgreementCharge");
  assert.equal(billed.targets[0].lines[0].amount, "4800.00");

  const planId = randomUUID();
  await createPlan(f.owner, {
    ...base(),
    id: planId,
    company_id: CRM.company,
    customer_id: CRM.org,
    site_id: CRM.site,
    asset_id: asset,
    owner_id: CRM.owner,
    content: {
      ...planContent(agreement.current_revision_id),
      interval: "SixMonthly",
      anchor: "2026-03-12",
      effective_from: "2026-03-12",
      timezone: "Australia/Brisbane",
      window_months: 12,
    },
  });
  await planCommand(f.owner, planId, {
    ...base(),
    expected_version: 1,
    action: "Review",
  });
  const generate = {
    ...base(),
    expected_version: 2,
    action: "Generate",
    from: "2026-03-13",
    until: "2027-03-11",
  };
  const generated = await planCommand(f.owner, planId, generate);
  assert.deepEqual(
    (await planCommand(f.owner, planId, generate)).receipt,
    generated.receipt,
  );
  const occurrences = await rows(
    "SELECT *,original_due::text AS due FROM ppo.maintenance_occurrences WHERE plan_id=$1",
    [planId],
  );
  assert.deepEqual(
    occurrences.map((o) => o.due),
    ["2026-09-12"],
  );
  const occurrence = occurrences[0];
  const entitlement = await assessment(
    f.owner,
    agreement.current_revision_id,
    occurrence.due,
  );
  const prepare = {
    ...base(),
    expected_version: 1,
    assessment_id: entitlement,
    owner_id: CRM.owner,
  };
  const prepared = await prepareWork(f.owner, "due", occurrence.id, prepare);
  const requests = await rows(
    "SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1",
    [occurrence.id],
  );
  assert.equal(requests.length, 1);
  const result = await serviceResult(
    f.owner,
    requests[0].id,
    79,
    "Complete",
    undefined,
    4,
    {
      time: timePayload(-7200000),
      material: {
        ...materialPayload(),
        description: "SYN covered filter element",
        quantity: "1",
      },
    },
  );
  assert.equal(
    (
      await rows("SELECT project_id FROM ppo.work_orders WHERE id=$1", [
        result.work_order_id,
      ])
    )[0].project_id,
    null,
  );
  const receive = {
    ...base(),
    expected_version: prepared.receipt.record_version,
    request_id: requests[0].id,
    report_revision_id: result.report.revisions[0].id,
    task_mapping: result.mapping,
  };
  const received = await receiveResult(f.owner, "due", occurrence.id, receive);
  assert.deepEqual(
    (await receiveResult(f.owner, "due", occurrence.id, receive)).receipt,
    received.receipt,
  );
  assert.deepEqual(
    (await prepareWork(f.owner, "due", occurrence.id, prepare)).receipt,
    prepared.receipt,
  );
  assert.equal(
    (
      await rows("SELECT state FROM ppo.maintenance_occurrences WHERE id=$1", [
        occurrence.id,
      ])
    )[0].state,
    "Completed",
  );
  const report = result.report;
  await requestReportIssue(f.owner, report.id, {
    ...base(),
    expected_version: report.version,
    revision_id: report.revisions[0].id,
    review_id: report.reviews[0].id,
    template_id: report.template.id,
    template_version: report.template.version,
  });
  const issuing = (await readReport(f.owner, report.id)).items[0];
  const issued = await processReportJob(issuing.jobs[0].id);
  assert.ok("issue_id" in issued, JSON.stringify(issued));
  const sources = await financeSources(f.preparer, result.work_order_id);
  assert.deepEqual(sources.allocation_defaults, {
    disposition: "NonBillable",
    reason: `Covered by agreement ${agreement.reference}`,
    target_group: null,
  });
  const source = sources.items.find((s) => s.id === report.id)!;
  assert.ok(source.ready && "source" in source && source.source);
  const entries: SourceEntry[] = source.source.entries;
  assert.deepEqual(entries.map((e) => [e.uom, e.quantity]).sort(), [
    ["EA", "1"],
    ["MIN", "90"],
  ]);
  const visit = {
    ...base(),
    ...common,
    id: randomUUID(),
    work_order_id: result.work_order_id,
    remaining_work_basis:
      "SYN all planned tasks reviewed Complete; no separate remedial work claimed",
    reports: [
      {
        report_id: source.id,
        revision_id: source.revision_id,
        review_id: source.review_id,
        issue_id: source.issue_id,
      },
    ],
    lines: entries.map((e) => ({
      entry_id: e.id,
      quantity: e.quantity,
      disposition: "NonBillable",
      target_group: null,
    })),
  };
  const saved = await saveFinance(f.preparer, null, visit);
  await process(f, visit.id);
  const noPosting = await readFinance(f.reconciler, visit.id);
  assert.equal(noPosting.reconciliations[0].result, "NoPostingRequired");
  assert.equal(noPosting.targets.length, 0);
  assert.ok(
    noPosting.lines.every(
      (l) => l.reason === `Covered by agreement ${agreement.reference}`,
    ),
  );
  assert.deepEqual(
    (await saveFinance(f.preparer, null, visit)).receipt,
    saved.receipt,
  );
  const duplicate = { ...fee, ...base(), id: randomUUID() };
  await saveFinance(f.preparer, null, duplicate);
  const duplicateRead = await readFinance(f.preparer, duplicate.id);
  await assert.rejects(
    submitFinance(f.preparer, duplicate.id, {
      ...base(),
      expected_version: duplicateRead.handoff.version,
    }),
    (e: unknown) =>
      (e as { code: string }).code === "ClaimEntitlementUnavailable",
  );
  const targets = await rows(
    "SELECT kind,lines FROM ppo.finance_simulator_targets WHERE handoff_id=ANY($1::uuid[]) ORDER BY kind",
    [[fee.id, visit.id, duplicate.id]],
  );
  assert.deepEqual(
    targets.map((t) => t.kind),
    ["SyntheticAgreementCharge"],
  );
  const holds = await rows(
    "SELECT h.state,l.agreement_id,h.agreement_charge_id FROM ppo.finance_allocation_holds h JOIN ppo.agreement_charge_lines l ON l.revision_id=h.agreement_revision_id AND l.charge_id=h.agreement_charge_id WHERE l.agreement_id=$1",
    [agreementId],
  );
  assert.deepEqual(
    holds.map((h) => [h.state, h.agreement_charge_id]),
    [["Consumed", chargeId]],
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.maintenance_work_requests WHERE occurrence_id=$1",
        [occurrence.id],
      )
    ).rows[0].n,
    1,
  );
}

async function process(
  f: Awaited<ReturnType<typeof projectFinanceFixture>>,
  id: string,
) {
  let r = await readFinance(f.preparer, id);
  await submitFinance(f.preparer, id, {
    ...base(),
    expected_version: r.handoff.version,
  });
  r = await readFinance(f.reviewer, id);
  await reviewFinance(f.reviewer, id, {
    ...base(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    source_hash: r.revisions[0].source_hash,
    decision: "Approved",
  });
  r = await readFinance(f.processor, id);
  await beginFinanceProcessing(f.processor, id, {
    ...base(),
    expected_version: r.handoff.version,
    scenario: "Accepted",
  });
  r = await readFinance(f.processor, id);
  await recordFinanceOutcome(f.processor, id, {
    ...base(),
    expected_version: r.handoff.version,
    attempt_id: r.handoff.active_attempt_id,
    action: "Dispatch",
  });
  r = await readFinance(f.reconciler, id);
  await reconcileFinance(f.reconciler, id, {
    ...base(),
    expected_version: r.handoff.version,
    outcome_id: r.outcomes[0].id,
    basis: "SYN independent exact target or no-posting comparison",
  });
}
