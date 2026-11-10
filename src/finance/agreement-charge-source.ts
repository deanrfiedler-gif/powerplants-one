import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { unavailable } from "../platform/errors";
import {
  agreementRevision,
  record,
  type Agreement,
} from "../maintenance/context";
import { agreementCurrentness } from "../maintenance/model";
import { blocked, hash, type FinanceCapability } from "./context";

export async function agreementFinanceContext(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: FinanceCapability = "finance.read",
) {
  const row = await record<Agreement>(c, p, "agreements", id);
  const { revision } = await agreementRevision(c, p, row.current_revision_id);
  for (const site of revision.content.sites)
    for (const duty of new Set([
      cap,
      "finance.read",
      "shared.finance.read",
    ] as const))
      await companyContext(c, p, row.company_id, site.site_id, duty);
  return { ...row, site_id: null };
}

export async function agreementChargeSource(
  c: QueryClient,
  p: Principal,
  agreement: string,
  revision: string,
  ids: string[],
  current = true,
) {
  const ctx = await agreementRevision(c, p, revision);
  if (ctx.row.id !== agreement) throw unavailable();
  if (hash(ctx.revision.content) !== ctx.revision.content_hash)
    blocked(
      "AgreementSourceChanged",
      "The exact agreement revision hash is invalid.",
    );
  // Retain Finance and source authority to every site of the historical revision too.
  for (const site of ctx.revision.content.sites)
    for (const duty of ["finance.read", "shared.finance.read"] as const)
      await companyContext(c, p, ctx.row.company_id, site.site_id, duty);
  const approval = (
    await c.query(
      "SELECT id FROM ppo.maintenance_events WHERE workspace_id=$1 AND record_id=$2 AND action='Approve' AND content->>'revision_id'=$3 ORDER BY version DESC LIMIT 1",
      [p.workspace_id, agreement, revision],
    )
  ).rows[0];
  if (!approval)
    blocked(
      "AgreementApprovalRequired",
      "The exact agreement charge schedule requires Finance approval.",
    );
  if (
    current &&
    (ctx.row.state !== "Active" ||
      ctx.row.current_revision_id !== revision ||
      ctx.revision.content.source.availability !== "Available")
  )
    blocked(
      "AgreementSourceChanged",
      "Use the current active approved agreement revision.",
    );
  if (current) {
    const today = (
      await c.query(
        "SELECT (clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date::text AS today",
      )
    ).rows[0].today;
    if (
      agreementCurrentness(ctx.row.state, ctx.revision.content, today) !==
      "Current"
    )
      blocked(
        "AgreementNotCurrent",
        "The agreement must be active within its effective term for a new charge effect.",
      );
  }
  const charges = [];
  for (const id of ids) {
    const line = (
      await c.query(
        "SELECT charge_id AS id,due_date::text,amount::text,currency,tax_basis, due_date<=(clock_timestamp() AT TIME ZONE 'Australia/Brisbane')::date AS due FROM ppo.agreement_charge_lines WHERE workspace_id=$1 AND agreement_id=$2 AND revision_id=$3 AND charge_id=$4",
        [p.workspace_id, agreement, revision, id],
      )
    ).rows[0];
    if (!line) throw unavailable();
    if (current && !line.due)
      blocked(
        "AgreementChargeNotDue",
        "A scheduled charge is claimable only on or after its date.",
      );
    charges.push({
      id: line.id as string,
      due_date: line.due_date as string,
      amount: line.amount as string,
    });
  }
  const schedule = ctx.revision.content.charge_schedule;
  if (!schedule) throw unavailable();
  return {
    agreement_id: agreement,
    revision_id: revision,
    source_hash: ctx.revision.content_hash,
    approval_id: approval.id as string,
    currency: schedule.currency,
    tax_basis: schedule.tax_basis,
    charges,
  };
}
export async function agreementFinanceHistory(
  c: QueryClient,
  p: Principal,
  id: string,
  agreement: string,
) {
  for (const r of (
    await c.query(
      "SELECT source_snapshot FROM ppo.finance_revisions WHERE workspace_id=$1 AND handoff_id=$2",
      [p.workspace_id, id],
    )
  ).rows) {
    const s = r.source_snapshot.agreement_charge;
    if (!s || s.agreement_id !== agreement) throw unavailable();
    await agreementChargeSource(
      c,
      p,
      agreement,
      s.revision_id,
      s.charges.map((x: { id: string }) => x.id),
      false,
    );
  }
}
