import type { SourceEntry } from "../../src/finance/context";
import { randomUUID } from "node:crypto";
import { reportIssued, principal, base, rows } from "./reports";
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
export { principal, base, rows, readFinance };
export async function financeDraft(mode = "SyntheticManual") {
  const q = await reportIssued(),
    p = await principal("finance"),
    options = await financeOptions(p),
    work = options.works.find(
      (w) => w.id === q.report.revisions[0].snapshot.work.id,
    )!,
    sources = await financeSources(p, work.id),
    s = sources.items.find((s) => s.id === q.report.id)!;
  if (!s.ready || !("source" in s) || !s.source) throw Error(JSON.stringify(s));
  const time = s.source.entries.find((e: SourceEntry) => e.uom === "MIN")!,
    material = s.source.entries.find((e: SourceEntry) => e.uom === "EA")!,
    id = randomUUID(),
    cmd = {
      ...base(),
      id,
      work_order_id: work.id,
      account_id: options.accounts.find(
        (a) => a.customer_id === work.customer_id,
      )!.id,
      mode,
      definition_id: options.definition.id,
      definition_version: options.definition.version,
      policy_version: options.definition.policy_version,
      reports: [
        {
          report_id: s.id,
          revision_id: s.revision_id,
          review_id: s.review_id,
          issue_id: s.issue_id,
        },
      ],
      lines: [
        {
          entry_id: time.id,
          quantity: "60",
          disposition: "Billable",
          reason:
            "F-06 synthetic allocation: sixty minutes to the fictional target.",
          target_group: "F06-LABOUR",
        },
        {
          entry_id: time.id,
          quantity: "30",
          disposition: "NonBillable",
          reason:
            "F-06 synthetic reviewed non-billable allocation remains consumed.",
          target_group: null,
        },
        {
          entry_id: material.id,
          quantity: "2",
          disposition: "Billable",
          reason:
            "F-06 synthetic service charge for two EA only; no stock movement or price.",
          target_group: "F06-MATERIAL",
        },
      ],
      treatment_basis:
        "F-06 independent synthetic fixture only; bill 60 MIN and 2 EA, explicitly disposition the remaining 30 MIN. No operational charging, warranty, price or tax decision.",
      remaining_work_basis:
        "F-06 this exact accepted Partial attendance only. The separately owned remaining task requires an authorised future visit; no project or work-order closure.",
    };
  const result = await saveFinance(p, null, cmd);
  return {
    q,
    p,
    id,
    cmd,
    result,
    reviewer: await principal("finance-reviewer"),
    processor: await principal("finance-processor"),
    reconciler: await principal("finance-reconciler"),
  };
}
export async function approvedFinance(mode = "SyntheticManual") {
  const q = await financeDraft(mode);
  let r = await readFinance(q.p, q.id);
  await submitFinance(q.p, q.id, {
    ...base(),
    expected_version: r.handoff.version,
  });
  r = await readFinance(q.p, q.id);
  const revision = (
    await rows("SELECT * FROM ppo.finance_revisions WHERE id=$1", [
      r.handoff.current_revision_id,
    ])
  )[0];
  await reviewFinance(q.reviewer, q.id, {
    ...base(),
    expected_version: r.handoff.version,
    revision_id: revision.id,
    source_hash: revision.source_hash,
    decision: "Approved",
  });
  return q;
}
export async function claimedFinance(scenario = "Accepted") {
  const q = await approvedFinance(
      scenario === "AcceptedThenTimeout" ? "SyntheticApi" : "SyntheticManual",
    ),
    r = await readFinance(q.processor, q.id);
  await beginFinanceProcessing(q.processor, q.id, {
    ...base(),
    expected_version: r.handoff.version,
    scenario,
  });
  return q;
}
export async function processedFinance(scenario = "Accepted") {
  const q = await claimedFinance(scenario),
    r = await readFinance(q.processor, q.id),
    cmd = {
      ...base(),
      expected_version: r.handoff.version,
      attempt_id: r.handoff.active_attempt_id,
      action: "Dispatch",
    };
  await recordFinanceOutcome(q.processor, q.id, cmd);
  return { ...q, outcomeCmd: cmd };
}
export async function reconciledFinance() {
  const q = await processedFinance(),
    r = await readFinance(q.reconciler, q.id),
    o = (
      await rows(
        "SELECT id FROM ppo.finance_outcomes WHERE handoff_id=$1 ORDER BY observed_at DESC",
        [q.id],
      )
    )[0];
  await reconcileFinance(q.reconciler, q.id, {
    ...base(),
    expected_version: r.handoff.version,
    outcome_id: o.id,
    basis:
      "F-06 exact 60 MIN and 2 EA posted, 30 MIN reviewed non-billable; like-unit comparisons independently checked.",
  });
  return q;
}
