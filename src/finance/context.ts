import type { Principal } from "../platform/identity";
import {
  scopeSql,
  requireCapability,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { unavailable, AppError } from "../platform/errors";
import { uuid } from "../shared/validation";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
import { verifyEvidence } from "../reports/service";
import { readReportBundle } from "../reports/worker";
import { quantity } from "./validation";

export function blocked(code: string, message: string): never {
  throw new AppError(409, code, message);
}
export const hash = (v: unknown) =>
  digest(canonical(JSON.parse(JSON.stringify(v))));
export type FinanceCapability = Extract<Capability, `finance.${string}`>;
export async function financeAccount(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: FinanceCapability = "finance.account.read",
) {
  await requireCapability(c, p, cap);
  const a = (
    await c.query(
      `SELECT f.* FROM ppo.finance_accounts f WHERE f.workspace_id=$1 AND f.id=$3 AND ${scopeSql("f.company_id", "NULL::uuid", cap)} AND ${scopeSql("f.company_id", "NULL::uuid", "shared.finance.read")}`,
      [p.workspace_id, p.actor_id, uuid(id, "account_id")],
    )
  ).rows[0];
  if (!a) throw unavailable();
  return a;
}
export async function accountCurrent(
  c: QueryClient,
  p: Principal,
  a: Awaited<ReturnType<typeof financeAccount>>,
) {
  const m = (
    await c.query(
      "SELECT * FROM ppo.erp_account_mappings WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, a.mapping_id],
    )
  ).rows[0];
  if (
    !m ||
    m.version !== a.mapping_version ||
    m.organisation_id !== a.organisation_id ||
    m.company_id !== a.company_id ||
    hash(m) !== hash(a.mapping_snapshot) ||
    new Date(m.valid_from) > new Date() ||
    (m.valid_to && new Date(m.valid_to) <= new Date()) ||
    a.status !== "SyntheticVerified"
  )
    blocked(
      "AccountContextChanged",
      "The exact synthetic account verification no longer matches its source mapping.",
    );
}
export async function financeWork(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: FinanceCapability = "finance.read",
) {
  await requireCapability(c, p, cap);
  const w = (
    await c.query(
      `SELECT w.*,s.display_name AS site_name,o.display_name AS customer_name FROM ppo.work_orders w JOIN ppo.sites s ON (s.workspace_id,s.id)=(w.workspace_id,w.site_id) JOIN ppo.organisations o ON (o.workspace_id,o.id)=(w.workspace_id,w.customer_id) WHERE w.workspace_id=$1 AND w.id=$3 AND ${scopeSql("w.company_id", "w.site_id", cap)} AND ${scopeSql("w.company_id", "w.site_id", "finance.read")} AND ${scopeSql("w.company_id", "w.site_id", "shared.finance.read")}`,
      [p.workspace_id, p.actor_id, uuid(id, "work_order_id")],
    )
  ).rows[0];
  if (!w) throw unavailable();
  return w;
}
export async function financeContext(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: FinanceCapability = "finance.read",
) {
  await requireCapability(c, p, cap);
  const h = (
    await c.query(
      `SELECT f.* FROM ppo.finance_handoffs f WHERE f.workspace_id=$1 AND f.id=$3 AND ${scopeSql("f.company_id", "f.site_id", cap)} AND ${scopeSql("f.company_id", "f.site_id", "finance.read")}`,
      [p.workspace_id, p.actor_id, uuid(id, "handoff_id")],
    )
  ).rows[0];
  if (!h) throw unavailable();
  const w = await financeWork(c, p, h.work_order_id, cap),
    a = await financeAccount(c, p, h.account_id, cap);
  if (
    w.customer_id !== h.customer_id ||
    a.organisation_id !== h.customer_id ||
    a.company_id !== h.company_id ||
    a.currency !== h.currency
  )
    throw unavailable();
  if (cap === "finance.prepare" && h.owner_id !== p.actor_id)
    throw unavailable();
  if (
    cap === "finance.process" &&
    h.processing_owner_id &&
    h.processing_owner_id !== p.actor_id
  )
    throw unavailable();
  return { h, w, a };
}
export async function definition(c: QueryClient, p: Principal) {
  const d = (
    await c.query(
      "SELECT d.*,p.version AS policy_version FROM ppo.finance_policy p JOIN ppo.finance_definitions d ON (d.workspace_id,d.id)=(p.workspace_id,p.definition_id) WHERE p.workspace_id=$1",
      [p.workspace_id],
    )
  ).rows[0];
  if (!d || hash(d.definition) !== d.content_hash)
    blocked(
      "FinanceDefinitionUnavailable",
      "The current exact Finance definition is unavailable.",
    );
  return d;
}
export type SourceRef = {
  report_id: string;
  revision_id: string;
  review_id: string;
  issue_id: string;
};
export type SourceEntry = {
  id: string;
  version: number;
  root_entry_id: string;
  report_revision_id: string;
  quantity: string;
  uom: string;
  direction: "Labour" | "Consumed" | "Returned";
  source_entry_hash: string;
  description: string;
};
// This is a Finance-owned projection. It never changes or confers service/file API authority.
export async function exactSource(
  c: QueryClient,
  p: Principal,
  w: Awaited<ReturnType<typeof financeWork>>,
  ref: SourceRef,
) {
  const r = (
    await c.query(
      "SELECT r.*,a.work_order_id FROM ppo.service_reports r JOIN ppo.appointments a ON (a.workspace_id,a.id)=(r.workspace_id,r.appointment_id) WHERE r.workspace_id=$1 AND r.id=$2",
      [p.workspace_id, ref.report_id],
    )
  ).rows[0];
  if (
    !r ||
    r.work_order_id !== w.id ||
    r.company_id !== w.company_id ||
    r.site_id !== w.site_id
  )
    throw unavailable();
  if (
    r.status !== "Issued" ||
    r.current_revision_id !== ref.revision_id ||
    r.current_issue_id !== ref.issue_id
  )
    blocked("SourceChanged", "Use the exact current issued report revision.");
  const v = (
      await c.query(
        "SELECT * FROM ppo.report_revisions WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
        [p.workspace_id, r.id, ref.revision_id],
      )
    ).rows[0],
    review = (
      await c.query(
        "SELECT * FROM ppo.report_reviews WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
        [p.workspace_id, r.id, ref.review_id],
      )
    ).rows[0],
    issue = (
      await c.query(
        "SELECT * FROM ppo.report_issues WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
        [p.workspace_id, r.id, ref.issue_id],
      )
    ).rows[0];
  if (
    !v ||
    !review ||
    !issue ||
    review.revision_id !== v.id ||
    issue.revision_id !== v.id ||
    issue.review_id !== review.id ||
    review.decision !== "Approved" ||
    review.source_hash !== v.source_hash ||
    hash(v.snapshot) !== v.source_hash
  )
    blocked(
      "ExactReviewRequired",
      "The approved entry set and issued source hashes must match exactly.",
    );
  const completion = v.snapshot.completion;
  if (review.authority_disposition !== "Current")
    blocked(
      "HistoricalAuthorityOnly",
      "This technical review accepts original attendance only. It does not establish current Finance source readiness.",
    );
  if (
    !["AllRecorded", "None"].includes(completion.time_declaration) ||
    !["AllRecorded", "None"].includes(completion.material_declaration)
  )
    blocked(
      "IncompleteDeclarations",
      "Accepted attendance is not Finance readiness: resolve the exact incomplete time/material declarations through a successor report.",
    );
  if (completion.scope_outcome !== "Complete") {
    const activity = (
      await c.query(
        "SELECT a.id FROM ppo.activities a JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.owner_id) WHERE a.workspace_id=$1 AND a.id=$2 AND u.active AND a.status NOT IN ('Completed','Cancelled')",
        [p.workspace_id, completion.follow_up_activity_id],
      )
    ).rows[0];
    if (!activity)
      blocked(
        "RemainingWorkUnowned",
        "Remaining work requires a current owned follow-up and an explicit Finance treatment basis.",
      );
  }
  // Recheck the P09 guard without borrowing a service owner's authority.
  const guard = review.source_guard,
    a = (
      await c.query(
        "SELECT * FROM ppo.appointments WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, r.appointment_id],
      )
    ).rows[0],
    site = (
      await c.query("SELECT * FROM ppo.sites WHERE workspace_id=$1 AND id=$2", [
        p.workspace_id,
        w.site_id,
      ])
    ).rows[0],
    customer = (
      await c.query(
        "SELECT * FROM ppo.organisations WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, w.customer_id],
      )
    ).rows[0],
    pack = (
      await c.query(
        "SELECT id,version,current_issue_id,status,needs_review FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
        [p.workspace_id, r.appointment_id],
      )
    ).rows[0],
    assets = (
      await c.query(
        "SELECT DISTINCT a.id,a.version,a.identity_status FROM ppo.assets a JOIN ppo.scope_assets sa ON sa.asset_id=a.id JOIN ppo.scope_items si ON si.id=sa.scope_item_id WHERE a.workspace_id=$1 AND si.scope_revision_id=$2 ORDER BY a.id",
        [p.workspace_id, a.scope_revision_id],
      )
    ).rows,
    controls = (
      await c.query(
        "SELECT id,criterion_code,assessment_version,outcome FROM ppo.readiness_assessments WHERE workspace_id=$1 AND scope_revision_id=$2 AND (appointment_id IS NULL OR appointment_id=$3) ORDER BY id",
        [p.workspace_id, a.scope_revision_id, a.id],
      )
    ).rows;
  const audience = (
    await c.query(
      "SELECT u.id,u.version,u.display_name AS name FROM ppo.people u WHERE u.workspace_id=$1 AND u.id=$2 AND u.active AND EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.workspace_id=u.workspace_id AND pc.person_id=u.id AND pc.company_id=$3)",
      [p.workspace_id, site.primary_contact_id, w.company_id],
    )
  ).rows[0];
  if (!audience || audience.id !== review.recipient_id)
    blocked(
      "SourceAudienceChanged",
      "The exact reviewed report audience context changed.",
    );
  const refs = await verifyEvidence(c, p, v.id),
    current = {
      assets,
      controls,
      service_owner_id: w.service_owner_id,
      scope_revision_id: w.scope_revision_id,
      authorised_scope_revision_id: w.authorised_scope_revision_id,
      site_version: site.version,
      customer_version: customer.version,
      primary_contact_id: site.primary_contact_id,
      assignment_version: a.assignment_version,
      schedule_version: a.schedule_version,
      pack,
      entries: refs.map((e) => ({ id: e.id, version: e.version })),
      recipient: audience,
    };
  if (hash(current) !== hash(guard))
    blocked(
      "SourceDependencyChanged",
      "Scope, coverage, readiness, attribution or document dependencies changed; Service must review a successor.",
    );
  await readReportBundle(p, issue.manifest);
  const entries: SourceEntry[] = [];
  for (const e of refs) {
    if (!["Time", "Material"].includes(e.kind)) continue;
    const decision = review.entry_decisions.find(
      (d: { id: string; version: number; decision: string }) =>
        d.id === e.id && d.version === e.version,
    );
    if (decision?.decision !== "Approved")
      blocked(
        "ExactEntryReviewRequired",
        "Every allocated entry requires its exact Approved technical decision.",
      );
    let q: string, uom: string, direction: SourceEntry["direction"];
    if (e.kind === "Time") {
      if (e.payload.elapsed_seconds % 60 !== 0)
        blocked(
          "UnsupportedQuantityBasis",
          "This minimum fixture defines exact whole minutes only; no rounding of seconds is authorised.",
        );
      q = String(e.payload.elapsed_seconds / 60);
      uom = "MIN";
      direction = "Labour";
    } else {
      if (!["Consumed", "Returned"].includes(e.payload.movement_kind))
        blocked(
          "UnsupportedMaterialDirection",
          "The selected material direction has no supported synthetic target definition.",
        );
      q = e.payload.quantity;
      uom = e.payload.uom;
      direction = e.payload.movement_kind;
    }
    const root = (
      await c.query(
        "WITH RECURSIVE chain AS (SELECT id,supersedes_entry_id FROM ppo.field_entries WHERE workspace_id=$1 AND id=$2 UNION ALL SELECT e.id,e.supersedes_entry_id FROM ppo.field_entries e JOIN chain x ON e.id=x.supersedes_entry_id WHERE e.workspace_id=$1) SELECT id FROM chain WHERE supersedes_entry_id IS NULL",
        [p.workspace_id, e.id],
      )
    ).rows[0];
    entries.push({
      id: e.id,
      version: e.version,
      root_entry_id: root.id,
      report_revision_id: v.id,
      quantity: quantity(q),
      uom,
      direction,
      source_entry_hash: hash(e),
      description:
        e.kind === "Time"
          ? `Captured ${e.payload.time_kind} time`
          : e.payload.description,
    });
  }
  return {
    ...ref,
    source_hash: v.source_hash,
    reference: r.display_number,
    completion,
    entries,
    issue_hash: issue.output_hash,
    review_hash: hash(review),
    scope_guard: current,
  };
}
export const receiptCapability = (command: string): FinanceCapability =>
  command === "FinanceSourceInvalidated"
    ? "finance.read"
    : command.includes("Evidence")
      ? "finance.issue"
      : command === "ReviewFinance"
        ? "finance.review"
        : ["BeginFinanceProcessing", "RecordFinanceOutcome"].includes(command)
          ? "finance.process"
          : ["ReconcileFinance", "RequestFinanceCorrection"].includes(command)
            ? "finance.reconcile"
            : "finance.prepare";
