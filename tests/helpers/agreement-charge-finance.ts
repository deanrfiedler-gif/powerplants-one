import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import {
  createAgreement,
  agreementCommand,
} from "../../src/maintenance/agreements";
import { agreementContent, CRM, base, principal } from "./maintenance";
import { financeOptions, readFinance } from "../../src/finance/reads";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
export { base, principal, readFinance };
export async function agreementChargeFixture(
  due = "2026-01-01",
  approve = true,
) {
  const owner = await principal(),
    reviewer = await principal("finance-reviewer"),
    preparer = await principal("finance"),
    processor = await principal("finance-processor"),
    reconciler = await principal("finance-reconciler");
  // Explicit test-only source authority, not a seed or an operational delegation.
  for (const p of [preparer, processor])
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
      SELECT workspace_id,$1,company_id,'maintenance.read',scope_type,scope_id,site_id FROM ppo.permission_grants
      WHERE user_id=$2 AND capability='maintenance.read' ON CONFLICT DO NOTHING`,
      [p.actor_id, owner.actor_id],
    );
  const id = randomUUID(),
    first = randomUUID(),
    second = randomUUID();
  const content = {
    ...agreementContent(),
    charge_schedule: {
      currency: "AUD",
      tax_basis: "Synthetic fee excluding GST; no tax calculation",
      lines: [
        { id: first, due_date: due, amount: "4800.00" },
        { id: second, due_date: "2026-06-01", amount: "1200.25" },
      ],
    },
  };
  const created = await createAgreement(owner, {
    ...base(),
    id,
    company_id: CRM.company,
    customer_id: CRM.org,
    owner_id: CRM.owner,
    content,
  });
  const row = (
    await database().query("SELECT * FROM ppo.service_agreements WHERE id=$1", [
      id,
    ])
  ).rows[0];
  if (approve)
    await agreementCommand(reviewer, id, {
      ...base(),
      expected_version: created.receipt.record_version,
      action: "Approve",
      authority_reference: "SYN Finance exact independent charge approval",
    });
  const options = await financeOptions(preparer),
    account = options.accounts.find((a) => a.customer_id === CRM.org)!;
  const draft = (ids: string[] = [first]) => ({
    ...base(),
    id: randomUUID(),
    source_kind: "AgreementCharge",
    agreement_id: id,
    agreement_revision_id: row.current_revision_id,
    charge_ids: ids,
    account_id: account.id,
    mode: "SyntheticApi",
    definition_id: options.definition.id,
    definition_version: options.definition.version,
    policy_version: options.definition.policy_version,
    treatment_basis:
      "SYN whole exact agreement charges; no operational tax invoice",
  });
  return {
    id,
    revision: row.current_revision_id as string,
    content,
    first,
    second,
    owner,
    preparer,
    reviewer,
    processor,
    reconciler,
    draft,
  };
}
export type AgreementFixture = Awaited<
  ReturnType<typeof agreementChargeFixture>
>;
export async function saveAgreementClaim(f: AgreementFixture, ids?: string[]) {
  const cmd = f.draft(ids);
  const result = await saveFinance(f.preparer, null, cmd);
  return { id: cmd.id, cmd, result };
}
export async function submitAgreementClaim(f: AgreementFixture, id: string) {
  const r = await readFinance(f.preparer, id);
  return submitFinance(f.preparer, id, {
    ...base(),
    expected_version: r.handoff.version,
  });
}
export async function reviewAgreementClaim(
  f: AgreementFixture,
  id: string,
  decision = "Approved",
) {
  const r = await readFinance(f.reviewer, id);
  return reviewFinance(f.reviewer, id, {
    ...base(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    source_hash: r.revisions[0].source_hash,
    decision,
  });
}
export async function beginAgreementClaim(
  f: AgreementFixture,
  id: string,
  scenario = "Accepted",
) {
  const r = await readFinance(f.processor, id);
  return beginFinanceProcessing(f.processor, id, {
    ...base(),
    expected_version: r.handoff.version,
    scenario,
  });
}
export async function outcomeAgreementClaim(
  f: AgreementFixture,
  id: string,
  action = "Dispatch",
) {
  const r = await readFinance(f.processor, id);
  return recordFinanceOutcome(f.processor, id, {
    ...base(),
    expected_version: r.handoff.version,
    attempt_id: r.handoff.active_attempt_id,
    action,
  });
}
export async function reconcileAgreementClaim(f: AgreementFixture, id: string) {
  const r = await readFinance(f.reconciler, id);
  return reconcileFinance(f.reconciler, id, {
    ...base(),
    expected_version: r.handoff.version,
    outcome_id: r.outcomes[0].id,
    basis: "SYN exact historical agreement charge reconciliation",
  });
}
