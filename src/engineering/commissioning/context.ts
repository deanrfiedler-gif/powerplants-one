import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import type { Capability, QueryClient } from "../../platform/permissions";
import { uuid } from "../../shared/validation";
import { coverage, isRequired, type Applicability, type CheckDefinition, type EffectiveResult, type Prerequisite } from "../../inspections/model";
import { loadInspections, localDate, type DefectRow, type LoadedAttempt } from "../../inspections/service";
import { engineeringRow } from "../service";
import {
  asBuiltPresentation, evidencePresentation, nextRequirement, obligationSatisfied, receivingState, redlineOpen, workflow,
  type AssociationState, type BasisState, type Destination, type DifferenceDisposition, type ObligationKind, type ObligationState, type PackageFacts, type Policy, type PolicyGrant,
  type ReceivingOutcome, type ReconciliationState, type RedlineState, type ReleaseState, type RequiredStage, type ScopeItem, type SharedInterface, type SourceCondition,
} from "./model";

export type PackageRow = Awaited<ReturnType<typeof engineeringRow>>;
const duties = {
  edit: "engineering.edit",
  capture: "engineering.commissioning.capture",
  review: "engineering.commissioning.review",
  issue: "engineering.commissioning.issue",
  receive: "engineering.commissioning.receive",
  source: "engineering.material.source",
} as const satisfies Record<string, Capability>;
export type Duty = keyof typeof duties;
export type Access = { pkg: PackageRow; site_name: string | null; site_timezone: string | null; can: Record<Duty, boolean>; internal: boolean; policy: Policy };

// Every read, count, command, download and receipt recovery starts here. engineeringRow already refuses a
// package outside the actor's workspace, company, site, customer and linked Project scope with "unavailable",
// so a foreign package is indistinguishable from a missing one. engineering.edit is preparation only: capture,
// review and approval, issue and receiving are each their own capability and, separately, their own entry in
// the versioned policy. No missing grant or policy ever falls back to an administrator.
export async function commissioningAccess(c: QueryClient, p: Principal, packageId: string): Promise<Access> {
  const pkg = await engineeringRow(c, p, uuid(packageId, "id"));
  const held = new Set((await c.query<{ capability: string }>(
    `SELECT DISTINCT g.capability FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
     WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND g.capability=ANY($3::text[]) AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
     AND (g.scope_type='Workspace' OR (g.company_id=$4 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$5::uuid))))`,
    [p.workspace_id, p.actor_id, Object.values(duties), pkg.company_id, pkg.site_id])).rows.map((r) => r.capability));
  const site = pkg.site_id ? (await c.query<{ display_name: string; timezone: string }>("SELECT display_name,timezone FROM ppo.sites WHERE workspace_id=$1 AND id=$2", [p.workspace_id, pkg.site_id])).rows[0] : undefined;
  const policy = (await c.query<{ id: string; policy_version: number; independence: NonNullable<Policy>["independence"]; grants: PolicyGrant[] }>(
    `SELECT id,policy_version,independence,grants FROM ppo.commissioning_policies WHERE workspace_id=$1 AND company_id=$2 AND (site_id IS NULL OR site_id=$3::uuid) AND effective_from<=clock_timestamp() ORDER BY policy_version DESC LIMIT 1`,
    [p.workspace_id, pkg.company_id, pkg.site_id])).rows[0];
  const can = Object.fromEntries(Object.entries(duties).map(([duty, capability]) => [duty, held.has(capability)])) as Record<Duty, boolean>;
  // Review notes, performer names and internal findings are internal detail. A receiver reads the manifest addressed to them.
  return { pkg, site_name: site?.display_name ?? null, site_timezone: site?.timezone ?? null, can, internal: can.edit || can.capture || can.review || can.issue || can.source, policy: policy ?? null };
}
const dutyRefusals: Record<Duty, string> = {
  edit: "This identity may read this commissioning work but cannot prepare it.",
  capture: "Capturing test evidence is the assigned performer's duty, which this identity does not hold for this company and site.",
  review: "Approval and evidence review are a separate duty. Editing a package never grants it, and this identity does not hold it for this company and site.",
  issue: "Issuing or withdrawing a release is a separate duty. This identity does not hold it for this company and site.",
  receive: "A receiving decision belongs to the named receiver. This identity does not hold that duty for this company and site.",
  source: "Sources are observed and assessed through the synthetic upstream adapter, which this identity does not operate.",
};
export function requireDuty(access: Access, duty: Duty) {
  if (!access.can[duty]) throw new AppError(403, "Forbidden", dutyRefusals[duty]);
}
export const dutyRefusal = (duty: Duty) => dutyRefusals[duty];
export const refuse = (code: string, message: string, status = 422) => new AppError(status, code, message);
export const blocked = (code: string, reasons: string[]) => new AppError(422, code, reasons.slice(0, 6).join(" "), reasons.slice(0, 30).map((message) => ({ field: "record", message })));
export const invalidField = (field: string, message: string) => new AppError(422, "InvalidData", "Check the highlighted details.", [{ field, message }]);
export const authority = (message: string | null) => {
  if (message) throw new AppError(403, message.startsWith("Authority not configured") ? "AuthorityNotConfigured" : "Forbidden", message);
};
export function currentVersion(actual: number, expected: number) {
  if (actual !== expected) throw new AppError(409, "VersionConflict", "This record changed while you were working. Your entries are retained; review the latest version before saving again.");
}
export const sha256 = (value: unknown) => createHash("sha256").update(typeof value === "string" ? value : canonical(value)).digest("hex");
export const stamp = (d: Date | null) => d?.toISOString() ?? null;

// A named person must be able to see this package and hold the duty they are being named for. A name typed
// into a form is never authority.
export async function eligiblePerson(c: QueryClient, p: Principal, access: Access, userId: string, field: string, duty: Duty | null = null) {
  const user = (await c.query<{ id: string; display_name: string }>("SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active", [p.workspace_id, userId])).rows[0];
  if (!user) throw invalidField(field, "Choose an active person in this workspace.");
  try {
    const theirs = await commissioningAccess(c, { ...p, actor_id: user.id, display_name: user.display_name }, access.pkg.id);
    if (duty && !theirs.can[duty]) throw unavailable();
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status)) throw invalidField(field, `${user.display_name} cannot take this on with their current access.`);
    throw e;
  }
  return user;
}

// ---------------------------------------------------------------------------------------------
// Sources are the retained upstream snapshots of EN-06's synthetic adapter. This module reads their identity
// and present use; it never publishes, edits or withdraws one, and it never promotes a cached copy to current.
export type SourceUse = "Current" | "Superseded" | "Withdrawn" | "Unavailable";
export type LiveSource = {
  id: string; kind: string; reference: string; title: string; revision: string; file_version: string; content_hash: string | null; permitted_purpose: string; observed_at: string;
  use: SourceUse; successor_id: string | null; restricted: boolean; readable: boolean; adapter: string; change_reason: string | null; changed_at: string | null;
};
export type SourceSnapshot = { source_id: string; kind: string; reference: string; revision: string; file_version: string; content_hash: string | null; observed_at: string };
export async function loadSources(c: QueryClient, p: Principal, access: Access): Promise<LiveSource[]> {
  const rows = (await c.query<Omit<LiveSource, "use" | "observed_at" | "readable" | "changed_at"> & { observed_at: Date; completeness: string; change: "Superseded" | "Withdrawn" | null; changed_at: Date | null }>(
    `SELECT s.id,s.kind,s.reference,s.title,s.revision,s.file_version,s.content_hash,s.permitted_purpose,s.observed_at,s.adapter,s.restricted,s.completeness,ch.change,ch.successor_id,ch.reason AS change_reason,ch.created_at AS changed_at
     FROM ppo.material_sources s LEFT JOIN ppo.material_source_changes ch ON (ch.workspace_id,ch.source_id)=(s.workspace_id,s.id) WHERE s.workspace_id=$1 AND s.package_id=$2 ORDER BY s.kind,s.reference,s.created_at`,
    [p.workspace_id, access.pkg.id])).rows;
  return rows.map(({ completeness, change, observed_at, changed_at, ...s }) => ({
    ...s, observed_at: observed_at.toISOString(), changed_at: changed_at?.toISOString() ?? null, use: change ?? (completeness === "Unavailable" ? "Unavailable" : "Current"),
    // A restricted source shows nothing of itself to someone without an internal duty: no title, no hash, no revision.
    readable: !s.restricted || access.internal,
  }));
}
export const snapshotOf = (s: LiveSource): SourceSnapshot => ({ source_id: s.id, kind: s.kind, reference: s.reference, revision: s.revision, file_version: s.file_version, content_hash: s.content_hash, observed_at: s.observed_at });
export type BoundSource = { role: "Procedure" | "IntendedDrawing" | "IntendedConfiguration"; snapshot: SourceSnapshot; live: LiveSource | null };
// What the adapter says now about what was bound then. A successor that a verified redline incorporated is the
// expected result of this package's own work, not a surprise; anything else that moved needs reassessment.
export function sourceCondition(bound: BoundSource[], expectedSuccessors: ReadonlySet<string>): { condition: SourceCondition; reasons: string[]; affected: BoundSource["role"][] } {
  if (!bound.some((b) => b.role === "Procedure")) return { condition: "NotCaptured", reasons: ["No approved procedure is bound yet."], affected: [] };
  const found: [SourceCondition, string, BoundSource["role"]][] = [];
  for (const b of bound) {
    const name = `${b.snapshot.reference} revision ${b.snapshot.revision}`;
    if (!b.live) found.push(["Unavailable", `${name} can no longer be found through the upstream adapter.`, b.role]);
    else if (!b.live.readable) found.push(["Restricted", "A required source is restricted for this identity, so its currentness cannot be shown here.", b.role]);
    else if (b.live.use === "Withdrawn") found.push(["ReassessmentRequired", `${name} was withdrawn by its owner. What was decided on it is retained; it cannot support a new decision.`, b.role]);
    else if (b.live.use === "Superseded" && !(b.live.successor_id && expectedSuccessors.has(b.live.successor_id))) found.push(["ReassessmentRequired", `${name} has a newer revision that this package has not assessed.`, b.role]);
    else if (b.live.use === "Unavailable") found.push(["Unavailable", `${name} could not be retrieved in full, so its currentness is not established.`, b.role]);
    else if (b.live.content_hash !== b.snapshot.content_hash) found.push(["ReassessmentRequired", `${name} no longer matches the content that was bound.`, b.role]);
  }
  const worst = (["ReassessmentRequired", "Unavailable", "Restricted"] as SourceCondition[]).find((k) => found.some(([x]) => x === k));
  return { condition: worst ?? "Current", reasons: found.map(([, text]) => text), affected: found.map(([, , role]) => role) };
}

// ---------------------------------------------------------------------------------------------
export type RecordRow = {
  id: string; workspace_id: string; company_id: string; package_id: string; site_id: string | null; version: number; created_at: Date; created_by: string; updated_at: Date; record_number: number; reference: string; title: string;
  system_name: string; area: string; owner_id: string | null; due: string | null; due_meaning: string | null; release_stage: "WholeScope" | "StagedArea"; current_scope: number; archived_at: Date | null; archived_reason: string | null; owner_name: string | null;
};
export type ScopeRow = { id: string; commissioning_id: string; version: number; scope_number: number; predecessor_id: string | null; state: "Working" | "Frozen"; statement: string | null; items: ScopeItem[]; interfaces: SharedInterface[]; content_hash: string; frozen_at: Date | null };
export type BasisRow = {
  id: string; commissioning_id: string; scope_id: string; version: number; created_at: Date; created_by: string; basis_number: number; predecessor_id: string | null; state: BasisState; reference: string; revision: string; approval_purpose: string;
  procedure_source_id: string | null; drawing_source_id: string | null; configuration_source_id: string | null; sources: Record<string, SourceSnapshot>; checks: CheckDefinition[]; prerequisites: Prerequisite[]; content_hash: string;
  submitted_hash: string | null; submitted_at: Date | null; submitted_by: string | null; decision_reason: string | null; decided_by: string | null; decided_at: Date | null; policy_version: number | null; independence_required: boolean | null;
  return_owner_id: string | null; return_due: string | null; submitted_by_name: string | null; decided_by_name: string | null; return_owner_name: string | null; created_by_name: string;
};
export type ConfigurationRow = {
  id: string; commissioning_id: string; version: number; snapshot_number: number; predecessor_id: string | null; state: "Working" | "UnderReview" | "Reconciled" | "Superseded"; installed_reference: string; installed_revision: string;
  intended_source_id: string | null; installed_source_id: string | null; submitted_by: string | null; submitted_at: Date | null; reconciled_by: string | null; reconciled_at: Date | null; reconcile_reason: string | null; content_hash: string | null;
  created_by: string; submitted_by_name: string | null; reconciled_by_name: string | null;
};
export type DifferenceRow = {
  id: string; configuration_id: string; version: number; item_key: string; kind: string; component: string; scope_key: string | null; critical: boolean; intended_value: string | null; intended_source: string | null; observed_value: string | null;
  observed_evidence: string | null; observation_verified: boolean; observed_by: string | null; observed_at: Date | null; proposed_as_built: string | null; disposition: DifferenceDisposition; disposition_reason: string | null; disposition_by: string | null;
  disposition_at: Date | null; change_id: string | null; redline_id: string | null; sort_order: number; observed_by_name: string | null; disposition_by_name: string | null;
  change: { reference: string; title: string; stage: string } | null;
};
export type RedlineRow = {
  id: string; commissioning_id: string; version: number; redline_number: number; reference: string; source_id: string; source_snapshot: SourceSnapshot; location: string; component: string; description: string; evidence: string | null;
  proposed_correction: string; classification: "Clerical" | "Material" | null; state: RedlineState; author_id: string; recorded_at: Date; owner_id: string | null; due: string | null; decision_reason: string | null; decided_by: string | null; decided_at: Date | null;
  change_id: string | null; predecessor_id: string | null; successor_source_id: string | null; verification_note: string | null; verified_by: string | null; verified_at: Date | null; author_name: string; owner_name: string | null; decided_by_name: string | null; verified_by_name: string | null;
  change: { reference: string; title: string; stage: string } | null;
};
export type AssociationRow = {
  id: string; commissioning_id: string; version: number; kind: string; from_reference: string; from_asset_id: string | null; to_reference: string; to_asset_id: string | null; source: string; confirmation_method: string | null; effective_from: Date;
  state: AssociationState; concern: string | null; constraint_source: string | null; affected_checks: string[]; predecessor_id: string | null; reviewer_id: string | null; reviewed_at: Date | null; review_note: string | null; created_by: string; created_at: Date; reviewer_name: string | null; created_by_name: string;
};
export type BackupRow = {
  id: string; commissioning_id: string; version: number; asset_reference: string; asset_id: string | null; purpose: string; configuration_version: string; native_format: string; stored_reference: string; content_hash: string | null; captured_at: Date;
  author_id: string; access_class: string; compatibility: string | null; required_stage: RequiredStage; available_evidence: string | null; available_at: Date | null; identity_evidence: string | null; identity_at: Date | null; restore_evidence: string | null; restore_at: Date | null;
  author_name: string; available_by_name: string | null; identity_by_name: string | null; restore_by_name: string | null;
};
export type ObligationRow = {
  id: string; commissioning_id: string; version: number; kind: ObligationKind; title: string; required_stage: RequiredStage; state: ObligationState; subject: string | null; content_revision: string | null; source_reference: string | null; planned_on: string | null;
  delivered_on: string | null; evidence: string | null; competence_note: string | null; disposition_reason: string | null; disposition_authority: string | null; owner_id: string; due: string | null; owner_name: string;
};
export type Exclusion = { key: string; reason: string; owner_id: string | null; residual: string | null };
export type Recipient = { destination: Destination; recipient_id: string; purpose: string };
export type ReleaseRow = {
  id: string; commissioning_id: string; version: number; created_at: Date; created_by: string; release_number: number; revision_number: number; predecessor_id: string | null; reference: string; state: ReleaseState; partial: boolean; scope_id: string; basis_id: string;
  configuration_id: string; included: string[]; excluded: Exclusion[]; audience: "Internal" | "Customer"; recipients: Recipient[]; manifest: Record<string, unknown>; manifest_hash: string; submitted_hash: string | null; submitted_by: string | null; submitted_at: Date | null;
  approved_by: string | null; approved_at: Date | null; approval_reason: string | null; policy_version: number | null; approval_operation_id: string | null; return_reason: string | null; returned_by: string | null; returned_at: Date | null;
  issued_by: string | null; issued_at: Date | null; issue_operation_id: string | null; withdrawn_by: string | null; withdrawn_at: Date | null; withdrawn_reason: string | null; successor_id: string | null;
  created_by_name: string; submitted_by_name: string | null; approved_by_name: string | null; returned_by_name: string | null; issued_by_name: string | null; withdrawn_by_name: string | null;
};
export type OutputRow = {
  id: string; commissioning_id: string; release_id: string; handover_id: string | null; kind: "OUT-12" | "OUT-13"; audience: "Internal" | "Customer"; template_version: string; renderer_version: string; manifest_hash: string; bundle_sha256: string; bundle_bytes: number;
  html_sha256: string; html_bytes: number; pdf_sha256: string; pdf_bytes: number; state: "Prepared" | "Issued" | "Discarded"; prepared_by: string; prepared_at: Date; issued_at: Date | null; prepared_by_name: string;
};
export type HandoverRow = {
  id: string; commissioning_id: string; release_id: string; version: number; created_at: Date; created_by: string; destination: Destination; recipient_id: string; purpose: string; support_owner_id: string | null; due: string | null; created_operation_id: string;
  adapter: string; cancelled_at: Date | null; cancelled_reason: string | null; recipient_name: string; support_owner_name: string | null; created_by_name: string;
};
export type SubmissionRow = {
  id: string; handover_id: string; version: number; submission_number: number; manifest: Record<string, unknown>; manifest_hash: string; output_id: string | null; correction_note: string | null; submitted_by: string; submitted_at: Date; operation_id: string;
  delivery: "Delivered" | "Pending" | "Unknown" | "Unavailable"; delivery_checked_at: Date | null; outcome: ReceivingOutcome | null; outcome_reason: string | null; outcome_by: string | null; outcome_at: Date | null; outcome_operation_id: string | null;
  return_owner_id: string | null; return_due: string | null; submitted_by_name: string; outcome_by_name: string | null; return_owner_name: string | null;
};
export type CheckRow = { id: string; commissioning_id: string; result: SourceCondition; details: unknown; adapter: "SyntheticUpstreamFixture" | "ManualAssessment"; assessment_evidence: string | null; checked_by: string; checked_at: Date; checked_by_name: string };

type Bundle = {
  records: RecordRow[]; scopes: ScopeRow[]; bases: BasisRow[]; configurations: ConfigurationRow[]; differences: DifferenceRow[]; redlines: RedlineRow[]; associations: AssociationRow[]; backups: BackupRow[]; obligations: ObligationRow[];
  releases: ReleaseRow[]; outputs: OutputRow[]; handovers: HandoverRow[]; submissions: SubmissionRow[]; checks: CheckRow[]; attempts: LoadedAttempt[]; defects: DefectRow[];
};
export type Loaded = ReturnType<typeof assemble>[number];

// One Engineering package, read whole in a fixed handful of queries. Filters, pages, the inspector and every
// guard narrow this same permission-scoped set, so a count can never disagree with its rows and a release gate
// never sees a page of a register.
export async function loadRecords(c: QueryClient, p: Principal, access: Access, sources: LiveSource[], lockId: string | null = null) {
  const scope = [p.workspace_id, access.pkg.id];
  if (lockId) await c.query("SELECT 1 FROM ppo.commissioning_packages WHERE workspace_id=$1 AND package_id=$2 AND id=$3 FOR UPDATE", [...scope, lockId]);
  const q = async <T extends Record<string, unknown>>(sql: string) => (await c.query<T>(sql, scope)).rows;
  const own = "JOIN ppo.commissioning_packages k ON (k.workspace_id,k.id)=(t.workspace_id,t.commissioning_id) WHERE t.workspace_id=$1 AND k.package_id=$2";
  const user = (alias: string, column: string, inner = false) => `${inner ? "" : "LEFT "}JOIN ppo.users ${alias} ON (${alias}.workspace_id,${alias}.id)=(t.workspace_id,t.${column})`;
  // A linked EN-07 change is read for its present stage only. The link is a referral; it is never the resolution.
  const change = "(SELECT jsonb_build_object('reference',x.reference,'title',x.title,'stage',x.stage) FROM ppo.engineering_changes x WHERE (x.workspace_id,x.id)=(t.workspace_id,t.change_id)) AS change";
  const records = await q<RecordRow>(`SELECT t.*,t.due::text,ow.display_name AS owner_name FROM ppo.commissioning_packages t ${user("ow", "owner_id")} WHERE t.workspace_id=$1 AND t.package_id=$2 ORDER BY t.record_number`);
  const inspections = await loadInspections(c, p, "ProjectCommissioningScope", records.map((r) => r.id), localDate(new Date(), access.site_timezone));
  const bundle: Bundle = {
    records, attempts: inspections.attempts, defects: inspections.defects,
    scopes: await q<ScopeRow>(`SELECT t.* FROM ppo.commissioning_scopes t ${own} ORDER BY t.scope_number`),
    bases: await q<BasisRow>(`SELECT t.*,t.return_due::text,sb.display_name AS submitted_by_name,db.display_name AS decided_by_name,ro.display_name AS return_owner_name,cb.display_name AS created_by_name FROM ppo.commissioning_bases t ${user("sb", "submitted_by")} ${user("db", "decided_by")} ${user("ro", "return_owner_id")} ${user("cb", "created_by", true)} ${own} ORDER BY t.basis_number`),
    configurations: await q<ConfigurationRow>(`SELECT t.*,sb.display_name AS submitted_by_name,rb.display_name AS reconciled_by_name FROM ppo.commissioning_configurations t ${user("sb", "submitted_by")} ${user("rb", "reconciled_by")} ${own} ORDER BY t.snapshot_number`),
    differences: await q<DifferenceRow>(`SELECT t.*,ob.display_name AS observed_by_name,db.display_name AS disposition_by_name,${change} FROM ppo.commissioning_differences t ${user("ob", "observed_by")} ${user("db", "disposition_by")}
      JOIN ppo.commissioning_configurations g ON (g.workspace_id,g.id)=(t.workspace_id,t.configuration_id) JOIN ppo.commissioning_packages k ON (k.workspace_id,k.id)=(g.workspace_id,g.commissioning_id) WHERE t.workspace_id=$1 AND k.package_id=$2 ORDER BY t.sort_order,t.item_key`),
    redlines: await q<RedlineRow>(`SELECT t.*,t.due::text,au.display_name AS author_name,ow.display_name AS owner_name,db.display_name AS decided_by_name,vb.display_name AS verified_by_name,${change} FROM ppo.commissioning_redlines t ${user("au", "author_id", true)} ${user("ow", "owner_id")} ${user("db", "decided_by")} ${user("vb", "verified_by")} ${own} ORDER BY t.redline_number`),
    associations: await q<AssociationRow>(`SELECT t.*,rv.display_name AS reviewer_name,cb.display_name AS created_by_name FROM ppo.commissioning_associations t ${user("rv", "reviewer_id")} ${user("cb", "created_by", true)} ${own} ORDER BY t.created_at,t.id`),
    backups: await q<BackupRow>(`SELECT t.*,au.display_name AS author_name,ab.display_name AS available_by_name,ib.display_name AS identity_by_name,rb.display_name AS restore_by_name FROM ppo.commissioning_backups t ${user("au", "author_id", true)} ${user("ab", "available_by")} ${user("ib", "identity_by")} ${user("rb", "restore_by")} ${own} ORDER BY t.created_at,t.id`),
    obligations: await q<ObligationRow>(`SELECT t.*,t.due::text,t.planned_on::text,t.delivered_on::text,ow.display_name AS owner_name FROM ppo.commissioning_obligations t ${user("ow", "owner_id", true)} ${own} ORDER BY t.created_at,t.id`),
    releases: await q<ReleaseRow>(`SELECT t.*,cb.display_name AS created_by_name,sb.display_name AS submitted_by_name,ab.display_name AS approved_by_name,rb.display_name AS returned_by_name,ib.display_name AS issued_by_name,wb.display_name AS withdrawn_by_name
      FROM ppo.commissioning_releases t ${user("cb", "created_by", true)} ${user("sb", "submitted_by")} ${user("ab", "approved_by")} ${user("rb", "returned_by")} ${user("ib", "issued_by")} ${user("wb", "withdrawn_by")} ${own} ORDER BY t.release_number,t.revision_number`),
    outputs: await q<OutputRow>(`SELECT t.id,t.commissioning_id,t.release_id,t.handover_id,t.kind,t.audience,t.template_version,t.renderer_version,t.manifest_hash,t.bundle_sha256,t.bundle_bytes,t.html_sha256,t.html_bytes,t.pdf_sha256,t.pdf_bytes,t.state,t.prepared_by,t.prepared_at,t.issued_at,pb.display_name AS prepared_by_name FROM ppo.commissioning_outputs t ${user("pb", "prepared_by", true)} ${own} ORDER BY t.prepared_at,t.id`),
    handovers: await q<HandoverRow>(`SELECT t.*,t.due::text,rc.display_name AS recipient_name,so.display_name AS support_owner_name,cb.display_name AS created_by_name FROM ppo.commissioning_handovers t ${user("rc", "recipient_id", true)} ${user("so", "support_owner_id")} ${user("cb", "created_by", true)} ${own} ORDER BY t.created_at,t.id`),
    submissions: await q<SubmissionRow>(`SELECT t.*,t.return_due::text,sb.display_name AS submitted_by_name,ob.display_name AS outcome_by_name,ro.display_name AS return_owner_name FROM ppo.commissioning_handover_submissions t ${user("sb", "submitted_by", true)} ${user("ob", "outcome_by")} ${user("ro", "return_owner_id")}
      JOIN ppo.commissioning_handovers h ON (h.workspace_id,h.id)=(t.workspace_id,t.handover_id) JOIN ppo.commissioning_packages k ON (k.workspace_id,k.id)=(h.workspace_id,h.commissioning_id) WHERE t.workspace_id=$1 AND k.package_id=$2 ORDER BY t.submission_number`),
    checks: await q<CheckRow>(`SELECT t.*,cb.display_name AS checked_by_name FROM ppo.commissioning_source_checks t ${user("cb", "checked_by", true)} ${own} ORDER BY t.checked_at DESC`),
  };
  return assemble(bundle, sources);
}

// "CFG-003 Rev C": how a tested configuration is named, compared without regard to spacing or case.
export const configurationLabel = (k: Pick<ConfigurationRow, "installed_reference" | "installed_revision">) => `${k.installed_reference} Rev ${k.installed_revision}`;
const plain = (text: string | null) => (text ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const group = <T, K>(rows: T[], key: (row: T) => K) => rows.reduce((map, row) => map.set(key(row), [...(map.get(key(row)) ?? []), row]), new Map<K, T[]>());
const sameDefinition = (a: CheckDefinition | undefined, b: CheckDefinition) => !!a && canonical(a) === canonical(b);
function assemble(b: Bundle, sources: LiveSource[]) {
  const byId = new Map(sources.map((s) => [s.id, s])), scopes = group(b.scopes, (x) => x.commissioning_id), bases = group(b.bases, (x) => x.commissioning_id), configurations = group(b.configurations, (x) => x.commissioning_id),
    differences = group(b.differences, (x) => x.configuration_id), redlines = group(b.redlines, (x) => x.commissioning_id), associations = group(b.associations, (x) => x.commissioning_id), backups = group(b.backups, (x) => x.commissioning_id),
    obligations = group(b.obligations, (x) => x.commissioning_id), releases = group(b.releases, (x) => x.commissioning_id), outputs = group(b.outputs, (x) => x.release_id), handovers = group(b.handovers, (x) => x.commissioning_id),
    submissions = group(b.submissions, (x) => x.handover_id), checks = group(b.checks, (x) => x.commissioning_id), attempts = group(b.attempts, (x) => x.row.host_id), defects = group(b.defects, (x) => x.host_id);
  return b.records.map((row) => {
    const allScopes = scopes.get(row.id) ?? [], scope = allScopes.find((s) => s.scope_number === row.current_scope) ?? allScopes.at(-1)!, allBases = bases.get(row.id) ?? [],
      approved = allBases.find((x) => x.state === "ApprovedForTest") ?? null, basis = approved ?? allBases.at(-1) ?? null, myAttempts = attempts.get(row.id) ?? [], myDefects = defects.get(row.id) ?? [],
      allConfigurations = configurations.get(row.id) ?? [], configuration = allConfigurations.filter((k) => k.state !== "Superseded").at(-1) ?? null, items = configuration ? differences.get(configuration.id) ?? [] : [],
      myRedlines = redlines.get(row.id) ?? [], myAssociations = (associations.get(row.id) ?? []).filter((a) => a.state !== "Superseded"), myBackups = backups.get(row.id) ?? [], myObligations = obligations.get(row.id) ?? [],
      allReleases = releases.get(row.id) ?? [], release = allReleases.filter((r) => r.state !== "Superseded").at(-1) ?? allReleases.at(-1) ?? null, myChecks = checks.get(row.id) ?? [];
    // The three exact sources the current basis bound, against what the adapter says of them now.
    const bound: BoundSource[] = basis ? ([["Procedure", basis.procedure_source_id], ["IntendedDrawing", basis.drawing_source_id], ["IntendedConfiguration", basis.configuration_source_id]] as const)
      .flatMap(([role, id]) => (id && basis.sources[id] ? [{ role, snapshot: basis.sources[id], live: byId.get(id) ?? null }] : [])) : [];
    const incorporated = new Set(myRedlines.filter((r) => r.state === "IncorporatedVerified" && r.successor_source_id).map((r) => r.successor_source_id!));
    let condition = sourceCondition(bound, incorporated);
    // Where the adapter cannot establish currentness, a named assessor's later manual assessment can. It names its evidence and its time.
    const manual = myChecks.find((k) => k.adapter === "ManualAssessment");
    if (condition.condition === "Unavailable" && manual?.result === "Current" && myChecks[0]?.id === manual.id) condition = { condition: "Current", reasons: [`Currentness was assessed manually by ${manual.checked_by_name}: ${manual.assessment_evidence}`], affected: [] };

    // The latest submitted result of every check of the current basis, with the three other dimensions it carries.
    const definitions = basis?.checks ?? [], reassess = new Set(myAssociations.filter((a) => a.state === "ReviewRequired").flatMap((a) => a.affected_checks));
    const effective: (EffectiveResult & { attempt_id: string; attempt_number: number })[] = [];
    for (const d of definitions) {
      const found = [...myAttempts].reverse().find((a) => a.row.state === "Submitted" && a.results.some((r) => r.check_key === d.key));
      if (!found) continue;
      const result = found.results.find((r) => r.check_key === d.key)!, planned = found.row.plan.find((x) => x.key === d.key);
      const applicability: Applicability = !sameDefinition(planned, d) || reassess.has(d.key) || found.instruments.some((i) => i.assessment === "WithdrawnForUse")
        || (configuration && configuration.state === "Reconciled" && plain(found.row.configuration_reference) !== plain(configurationLabel(configuration))) ? "ReassessmentRequired" : "Current";
      effective.push({ check_key: d.key, evaluation: result.evaluation ?? "NotTested", review: found.review, applicability, attempt_id: found.row.id, attempt_number: found.row.attempt_number });
    }
    // A live partial candidate names its own scope, and is judged by that scope's own complete rule set: what it holds back
    // is listed with its reason and its owner, and stays open work on the package.
    const declared = new Set(scope.items.filter((i) => i.disposition === "Included").map((i) => i.key)), staged = release && release.partial && ["Draft", "InReview", "ApprovedForIssue", "Issued"].includes(release.state),
      included = staged ? new Set(release.included) : declared, cover = coverage(definitions, effective, included);
    const open = items.filter((i) => i.disposition === "Open" || i.disposition === "RejectedCorrectionRequired"), referred = items.filter((i) => i.disposition === "ReferredToChange");
    const reconciliation: ReconciliationState = !configuration ? "Unassessed" : configuration.state === "Reconciled" ? "Reconciled" : configuration.state === "UnderReview" ? "UnderReview" : open.length || referred.length ? "DifferencesOpen" : "Unassessed";
    const requests = (handovers.get(row.id) ?? []).filter((h) => !h.cancelled_at).map((h) => {
      const all = submissions.get(h.id) ?? [], last = all.at(-1) ?? null;
      return { handover: h, submissions: all, last, state: receivingState(last ? { latest_outcome: last.outcome, delivery: last.delivery } : null) };
    });
    const live = release && release.state === "Issued" ? requests.filter((r) => r.handover.release_id === release.id) : [];
    const redlinesOpen = myRedlines.filter((r) => redlineOpen(r.state)), toIncorporate = redlinesOpen.filter((r) => r.state === "AcceptedForIncorporation");
    const facts: PackageFacts = {
      archived: !!row.archived_at, basis: basis?.state ?? "None", basis_in_review: allBases.some((x) => x.state === "InReview"), coverage: cover, attempts: myAttempts.filter((a) => a.row.state === "Submitted").length,
      attempts_in_review: myAttempts.filter((a) => a.review === "InReview" || a.review === "OnHold" || a.review === "ClarificationRequired").length,
      // A returned attempt is open work until a later attempt covers its checks.
      attempts_returned: myAttempts.filter((a) => a.review === "Returned" && a.row.check_keys.some((k) => { const d = definitions.find((x) => x.key === k); return !d?.scope_key || included.has(d.scope_key); }) && !myAttempts.some((x) => x.row.attempt_number > a.row.attempt_number && x.row.state === "Submitted" && a.row.check_keys.every((k) => x.row.check_keys.includes(k)))).length,
      defects_open: myDefects.filter((d) => d.state !== "Closed" && (d.scope_key === null || included.has(d.scope_key))).length, reconciliation, differences_open: open.length, referred_open: referred.length,
      redlines_review: redlinesOpen.length - toIncorporate.length, redlines_to_incorporate: toIncorporate.length, associations_review: myAssociations.filter((a) => a.state === "ReviewRequired" || a.state === "Proposed").length,
      identity_unverified_critical: scope.items.filter((i) => i.disposition === "Included" && i.critical && i.identity !== "Verified").length,
      backups_unverified: myBackups.filter((k) => (k.required_stage === "TestPrerequisite" || k.required_stage === "TechnicalIssue") && !k.identity_at).length,
      holds_open: myObligations.filter((o) => o.kind === "Hold" && !obligationSatisfied(o.state)).length, source: condition.condition,
      release: release?.state ?? "None", release_partial: release ? release.partial : row.release_stage === "StagedArea",
      release_applicability: release?.state === "Issued" && (condition.condition === "ReassessmentRequired" || cover.reassessment > 0) ? "ReassessmentRequired" : release?.state === "Issued" && condition.condition === "Unavailable" ? "Unavailable" : "Current",
      candidate_ready: false, obligations: myObligations.map((o) => ({ id: o.id, kind: o.kind, title: o.title, stage: o.required_stage, state: o.state, owner_name: o.owner_name })),
      receiving: live.map((r) => ({ destination: r.handover.destination, state: r.state })),
    };
    facts.candidate_ready = facts.basis === "ApprovedForTest" && cover.required > 0 && cover.accepted === cover.required && reconciliation === "Reconciled" && !redlinesOpen.length && !facts.defects_open && (release === null || release.state === "Draft");
    const next = nextRequirement(facts);
    return {
      row, scope, scopes: allScopes, basis, approved_basis: approved, bases: allBases, bound, condition, definitions, effective, coverage: cover, attempts: myAttempts, defects: myDefects, configuration, configurations: allConfigurations, differences: items,
      all_differences: allConfigurations.flatMap((k) => differences.get(k.id) ?? []), redlines: myRedlines, associations: myAssociations, all_associations: associations.get(row.id) ?? [], backups: myBackups, obligations: myObligations,
      release, releases: allReleases, outputs: allReleases.flatMap((r) => outputs.get(r.id) ?? []), requests, checks: myChecks, facts, workflow: workflow(facts), next,
      evidence_view: evidencePresentation(cover, facts.attempts), as_built_view: asBuiltPresentation(facts),
      required_checks: definitions.filter((d) => isRequired(d)).length,
      // Coverage of exactly the scope a release candidate names: a partial scope is judged by its own complete rule set.
      coverageFor: (keys: ReadonlySet<string>) => coverage(definitions, effective, keys),
    };
  });
}

// ---------------------------------------------------------------------------------------------
const tables = {
  Package: "commissioning_packages", Scope: "commissioning_scopes", Basis: "commissioning_bases", Attempt: "inspection_attempts", Review: "inspection_reviews", Defect: "inspection_defects", Configuration: "commissioning_configurations",
  Difference: "commissioning_differences", Redline: "commissioning_redlines", Association: "commissioning_associations", Backup: "commissioning_backups", Obligation: "commissioning_obligations", Release: "commissioning_releases",
  Output: "commissioning_outputs", Handover: "commissioning_handovers", Submission: "commissioning_handover_submissions", SourceCheck: "commissioning_source_checks",
} as const;
export type SubjectType = keyof typeof tables;
// History is written in the transaction that made the change, with the exact row as it then stood. Large frozen
// documents are left to their own rows: the event names them by identity.
export async function record(c: PoolClient, p: Principal, access: Access, command: { operation_id: string; reason: string }, e: { commissioning_id: string; subject_type: SubjectType; subject_id: string; event_type: string; note?: string | null }) {
  await c.query(
    `INSERT INTO ppo.commissioning_events(id,workspace_id,company_id,package_id,commissioning_id,subject_type,subject_id,record_version,event_type,reason,note,snapshot,operation_id,created_by)
     SELECT $1,k.workspace_id,k.company_id,k.package_id,k.id,$2,t.id,k.version,$3,$4,$5,to_jsonb(t)-'plan'-'checks'-'manifest'-'content'-'items',$6,$7
     FROM ppo.${tables[e.subject_type]} t JOIN ppo.commissioning_packages k ON (k.workspace_id,k.id)=(t.workspace_id,$8::uuid) WHERE t.workspace_id=$9 AND t.id=$10`,
    [randomUUID(), e.subject_type, e.event_type, command.reason, e.note ?? null, command.operation_id, p.actor_id, e.commissioning_id, p.workspace_id, e.subject_id]);
}
// Every accepted command advances the commissioning package, so an approval or an issue made against version N
// can never race past a test result, a review, a redline or a receiving outcome recorded after N.
export async function touch(c: PoolClient, p: Principal, id: string, set = "", values: unknown[] = []) {
  const row = (await c.query<{ id: string; version: number; updated_at: Date }>(
    `UPDATE ppo.commissioning_packages SET version=version+1,updated_at=clock_timestamp(),updated_by=$3${set ? `,${set}` : ""} WHERE workspace_id=$1 AND id=$2 RETURNING id,version,updated_at`, [p.workspace_id, id, p.actor_id, ...values])).rows[0];
  if (!row) throw unavailable();
  return row;
}
