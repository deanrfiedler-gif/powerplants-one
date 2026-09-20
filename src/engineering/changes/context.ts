import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import type { Capability, QueryClient } from "../../platform/permissions";
import { uuid } from "../../shared/validation";
import { engineeringRow } from "../service";
import {
  applicability, attention, implementationProgress, nextAction, overlapsBlockingHandover, sourceCondition,
  type AffectedObject, type CategoryFinding, type ChangeCategory, type ChangeFacts, type ChangeOption, type ComparisonRow, type CostComponent, type DateEffect,
  type DecisionPurpose, type Destination, type Overlap, type Policy, type PolicyGrant, type Prerequisite, type ProposalDocument, type ReceivingOutcome,
  type RequestPurpose, type RetestDefinition, type ReturnKind, type RevisionState, type SourceLink, type SourcePurpose, type SourceRole, type SourceSnapshot,
  type SourceUse, type Stage, type TechnicalDecision, type VerificationState,
} from "./model";

export type PackageRow = Awaited<ReturnType<typeof engineeringRow>>;
const duties = {
  edit: "engineering.edit",
  review: "engineering.change.review",
  decide: "engineering.change.decide",
  receive: "engineering.change.receive",
  verify: "engineering.change.verify",
  close: "engineering.change.close",
  commercial: "project.edit",
  source: "engineering.material.source",
} as const satisfies Record<string, Capability>;
export type Duty = keyof typeof duties;
export type Access = { pkg: PackageRow; site_name: string | null; site_timezone: string | null; can: Record<Duty, boolean>; costs: boolean; policy: Policy };

// Every read, count, command, export and receipt recovery starts here. engineeringRow already refuses a
// package outside the actor's workspace, company, site, customer and linked Project/Opportunity scope
// with "unavailable", so a foreign package is indistinguishable from a missing one. engineering.edit is
// authorship only: review, technical decision, receiving, verification and closure are each their own
// capability and, separately, their own entry in the versioned policy.
export async function changesAccess(c: QueryClient, p: Principal, packageId: string): Promise<Access> {
  const pkg = await engineeringRow(c, p, uuid(packageId, "id"));
  const held = new Set(
    (
      await c.query<{ capability: string }>(
        `SELECT DISTINCT g.capability FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
         WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND g.capability=ANY($3::text[])
         AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
         AND (g.scope_type='Workspace' OR (g.company_id=$4 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$5::uuid))))`,
        [p.workspace_id, p.actor_id, Object.values(duties), pkg.company_id, pkg.site_id],
      )
    ).rows.map((r) => r.capability),
  );
  const site = pkg.site_id
    ? (await c.query<{ display_name: string; timezone: string }>("SELECT display_name,timezone FROM ppo.sites WHERE workspace_id=$1 AND id=$2", [p.workspace_id, pkg.site_id])).rows[0]
    : undefined;
  const policy = (
    await c.query<{ id: string; policy_version: number; grants: PolicyGrant[] }>(
      `SELECT id,policy_version,grants FROM ppo.change_policies
       WHERE workspace_id=$1 AND company_id=$2 AND (site_id IS NULL OR site_id=$3::uuid) AND effective_from<=clock_timestamp()
       ORDER BY policy_version DESC LIMIT 1`,
      [p.workspace_id, pkg.company_id, pkg.site_id],
    )
  ).rows[0];
  const can = Object.fromEntries(Object.entries(duties).map(([duty, capability]) => [duty, held.has(capability)])) as Record<Duty, boolean>;
  // Cost components are commercial detail: the people who author, decide or commercially review them see
  // them. A receiver, verifier or viewer sees that a commercial prerequisite exists and its state only.
  return { pkg, site_name: site?.display_name ?? null, site_timezone: site?.timezone ?? null, can, costs: can.edit || can.decide || can.commercial, policy: policy ?? null };
}
const dutyRefusals: Record<Duty, string> = {
  edit: "This identity may read these changes but cannot author them.",
  review: "Discipline review is a separate duty. This identity does not hold it for this company and site.",
  decide: "The technical decision is a separate duty. This identity does not hold it for this company and site.",
  receive: "Receiving decisions belong to the destination's owner. This identity does not hold that duty for this company and site.",
  verify: "Recording a test result is the verifier's duty, which this identity does not hold.",
  close: "Closing a change is a separate duty. This identity does not hold it for this company and site.",
  commercial: "A commercial or scheduling decision belongs to the Project's commercial coordinator.",
  source: "Sources are observed through the synthetic upstream adapter, which this identity does not operate.",
};
export function requireDuty(access: Access, duty: Duty) {
  if (!access.can[duty]) throw new AppError(403, "Forbidden", dutyRefusals[duty]);
}
export const dutyRefusal = (duty: Duty) => dutyRefusals[duty];
export const refuse = (code: string, message: string, status = 422) => new AppError(status, code, message);
export const blocked = (code: string, reasons: string[]) =>
  new AppError(422, code, reasons.slice(0, 6).join(" "), reasons.slice(0, 20).map((message) => ({ field: "change", message })));
export const authority = (message: string | null) => {
  if (message) throw new AppError(403, message.startsWith("Authority not configured") ? "AuthorityNotConfigured" : "Forbidden", message);
};
export function currentVersion(actual: number, expected: number) {
  if (actual !== expected) throw new AppError(409, "VersionConflict", "This record changed while you were working. Your entries are retained; review the latest version before saving again.");
}
export const sha256 = (value: unknown) => createHash("sha256").update(typeof value === "string" ? value : canonical(value)).digest("hex");

// A named person must be able to see this package, and hold the duty they are being named for. A name
// typed into a form is never authority.
export async function eligiblePerson(c: QueryClient, p: Principal, access: Access, userId: string, field: string, duty: Duty | null = null) {
  const user = (await c.query<{ id: string; display_name: string }>("SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active", [p.workspace_id, userId])).rows[0];
  if (!user) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field, message: "Choose an active person in this workspace." }]);
  try {
    const theirs = await changesAccess(c, { ...p, actor_id: user.id, display_name: user.display_name }, access.pkg.id);
    if (duty && !theirs.can[duty]) throw unavailable();
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status))
      throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field, message: `${user.display_name} cannot take this on with their current access.` }]);
    throw e;
  }
  return user;
}

// ---------------------------------------------------------------------------------------------
// Sources are the retained upstream snapshots of EN-06's synthetic adapter. This module reads their
// identity and present use; it never publishes, edits or withdraws one.
export type LiveSource = {
  id: string; kind: string; reference: string; title: string; revision: string; file_version: string; content_hash: string | null;
  permitted_purpose: SourcePurpose; observed_at: string; use: SourceUse; successor_id: string | null; predecessor_id: string | null;
  restricted: boolean; readable: boolean; adapter: string; change_reason: string | null; changed_at: string | null;
};
export async function loadSources(c: QueryClient, p: Principal, access: Access): Promise<LiveSource[]> {
  const rows = (
    await c.query<Omit<LiveSource, "use" | "observed_at" | "readable" | "changed_at"> & { observed_at: Date; completeness: string; change: SourceUse | null; changed_at: Date | null }>(
      `SELECT s.id,s.kind,s.reference,s.title,s.revision,s.file_version,s.content_hash,s.permitted_purpose,s.observed_at,s.adapter,s.restricted,s.completeness,s.predecessor_id,
        ch.change,ch.successor_id,ch.reason AS change_reason,ch.created_at AS changed_at
       FROM ppo.material_sources s LEFT JOIN ppo.material_source_changes ch ON (ch.workspace_id,ch.source_id)=(s.workspace_id,s.id)
       WHERE s.workspace_id=$1 AND s.package_id=$2 ORDER BY s.kind,s.reference,s.created_at`,
      [p.workspace_id, access.pkg.id],
    )
  ).rows;
  const privileged = access.can.edit || access.can.review || access.can.decide || access.can.verify || access.can.source;
  return rows.map(({ completeness, change, observed_at, changed_at, ...s }) => ({
    ...s, observed_at: observed_at.toISOString(), changed_at: changed_at?.toISOString() ?? null,
    use: (change ?? (completeness === "Unavailable" ? "Unavailable" : "Current")) as SourceUse,
    readable: !s.restricted || privileged,
  }));
}
export const snapshotOf = (s: LiveSource): SourceSnapshot => ({ reference: s.reference, revision: s.revision, file_version: s.file_version, content_hash: s.content_hash, permitted_purpose: s.permitted_purpose, observed_at: s.observed_at });

// ---------------------------------------------------------------------------------------------
export type ChangeRow = {
  id: string; workspace_id: string; company_id: string; package_id: string; version: number; created_at: Date; created_by: string; updated_at: Date; updated_by: string;
  change_number: number; reference: string; title: string; category: ChangeCategory; discipline: string; location: string; system_name: string;
  author_id: string; next_owner_id: string | null; due: string | null; priority: string | null; priority_reason: string | null; stage: Stage; current_revision: number;
  stage_before_withdrawal: Stage | null; withdrawn_at: Date | null; withdrawn_by: string | null; withdrawn_reason: string | null;
  as_built_required: boolean; as_built_reference: string | null; predecessor_change_id: string | null; author_name: string; next_owner_name: string | null;
};
export type RevisionRow = {
  id: string; change_id: string; version: number; created_at: Date; created_by: string; updated_at: Date; updated_by: string; revision_number: number; predecessor_id: string | null;
  state: RevisionState; rationale: string | null; proposed_reference: string | null; proposed_revision: string | null; scope_statement: string | null; requires_revised_release: boolean;
  comparison: ComparisonRow[]; options: ChangeOption[]; selected_option: string | null; categories: CategoryFinding[]; costs: CostComponent[]; dates: DateEffect[];
  content_hash: string; submitted_hash: string | null; submitted_at: Date | null; submitted_by: string | null; return_kind: ReturnKind | null; return_reason: string | null;
  returned_by: string | null; returned_at: Date | null; return_owner_id: string | null; return_due: string | null;
  submitted_by_name: string | null; returned_by_name: string | null; return_owner_name: string | null;
};
export type ObjectRow = AffectedObject & { revision_id: string; sort_order: number; owner_name: string | null };
export type LinkRow = { revision_id: string; source_id: string; role: SourceRole; required: boolean; snapshot: SourceSnapshot };
export type RetestRow = RetestDefinition & { revision_id: string; sort_order: number; verifier_name: string | null };
export type AttemptRow = {
  id: string; change_id: string; retest_id: string; attempt_number: number; result: "Passed" | "Failed"; tested_at: Date; configuration_present: string; evidence_reference: string;
  evidence_source_id: string | null; result_source: string; note: string | null; corrective_action: string | null; corrective_owner_id: string | null; corrective_due: string | null;
  procedure_source_id: string; recorded_by: string; recorded_at: Date; operation_id: string; recorded_by_name: string; corrective_owner_name: string | null;
};
export type ReviewRow = {
  id: string; change_id: string; revision_id: string; version: number; discipline: string; reviewer_id: string; required: boolean; result: string | null; findings: string | null;
  revision_hash: string | null; policy_version: number | null; responded_at: Date | null; created_at: Date; reviewer_name: string;
};
export type DecisionRow = {
  id: string; change_id: string; revision_id: string; revision_hash: string; option_key: string; result: "Accepted" | "Rejected"; purpose: DecisionPurpose; reason: string;
  source_state: unknown; policy_id: string; policy_version: number; operation_id: string; decided_by: string; decided_at: Date; decided_by_name: string;
};
export type PrerequisiteRow = Prerequisite & {
  id: string; change_id: string; decision_id: string; version: number; applicability_reason: string; owner_id: string | null; due: string | null; outcome_note: string | null;
  evidence_source_id: string | null; resolved_by: string | null; resolved_at: Date | null; outcome_operation_id: string | null; authority: string; owner_name: string | null; resolved_by_name: string | null;
};
export type HandoverRow = {
  id: string; change_id: string; revision_id: string; decision_id: string | null; version: number; created_at: Date; created_by: string; purpose: RequestPurpose; destination: Destination;
  owner_id: string; requested_action: string; due: string | null; state: ReceivingOutcome; amends_id: string | null; acknowledgement_required: boolean; acknowledged_by: string | null;
  acknowledged_at: Date | null; cancelled_by: string | null; cancelled_at: Date | null; cancelled_reason: string | null; created_operation_id: string; owner_name: string; created_by_name: string;
};
export type SubmissionRow = {
  id: string; handover_id: string; version: number; submission_number: number; payload: Record<string, unknown>; payload_hash: string; submitted_by: string; submitted_at: Date;
  operation_id: string; outcome: "Accepted" | "Returned" | "Declined" | null; outcome_reason: string | null; outcome_evidence: string | null; outcome_by: string | null;
  outcome_at: Date | null; outcome_operation_id: string | null; return_owner_id: string | null; return_due: string | null; submitted_by_name: string; outcome_by_name: string | null; return_owner_name: string | null;
};
export type CheckRow = { id: string; change_id: string; revision_id: string; result: string; details: unknown; adapter: string; checked_by: string; checked_at: Date; checked_by_name: string };
export type ClosureRow = { id: string; change_id: string; meaning: "Implemented" | "NoImplementation"; basis: Record<string, unknown>; basis_hash: string; reason: string; policy_version: number; closed_by: string; closed_at: Date; closed_by_name: string };

// The technical content of a proposal: what a review, a decision, a handover payload and a closure rely
// on. Coordination (next owner, due date, priority) is deliberately outside it, so chasing an action
// never invalidates a decision, while any change of scope, source, option, criterion or evidence does.
export function revisionHash(header: Pick<ChangeRow, "title" | "category" | "discipline" | "location" | "system_name">, doc: ProposalDocument, snapshots: ReadonlyMap<string, SourceSnapshot>) {
  const object = ({ id: _id, ...o }: AffectedObject) => { void _id; return o; };
  return sha256({
    header: { title: header.title, category: header.category, discipline: header.discipline, location: header.location, system_name: header.system_name },
    rationale: doc.rationale, proposed_reference: doc.proposed_reference, proposed_revision: doc.proposed_revision, scope_statement: doc.scope_statement,
    requires_revised_release: doc.requires_revised_release, comparison: doc.comparison, options: doc.options, selected_option: doc.selected_option,
    categories: [...doc.categories].sort((a, b) => a.key.localeCompare(b.key)), costs: doc.costs, dates: doc.dates,
    objects: [...doc.objects].sort((a, b) => a.object_key.localeCompare(b.object_key)).map(object),
    sources: [...doc.sources].sort((a, b) => a.source_id.localeCompare(b.source_id)).map((s) => ({ ...s, snapshot: snapshots.get(s.source_id) ?? null })),
    retests: doc.retests,
  });
}

const iso = (d: Date | null) => d?.toISOString() ?? null;
export type LoadedChange = ReturnType<typeof assemble>[number];
type Bundle = {
  changes: ChangeRow[]; revisions: RevisionRow[]; objects: ObjectRow[]; links: LinkRow[]; retests: RetestRow[]; attempts: AttemptRow[]; reviews: ReviewRow[]; decisions: DecisionRow[];
  prerequisites: PrerequisiteRow[]; handovers: HandoverRow[]; submissions: SubmissionRow[]; checks: CheckRow[]; closures: ClosureRow[]; overlaps: Map<string, Overlap[]>; resolved: Map<string, Set<string>>;
};

// One package, read whole in a fixed handful of queries. Filters, pages and the inspector all narrow this
// same permission-scoped set, so a count can never disagree with its rows and a guard never sees a page.
export async function loadPackageChanges(c: QueryClient, p: Principal, access: Access, sources: LiveSource[], lockChangeId: string | null = null) {
  const scope = [p.workspace_id, access.pkg.id];
  if (lockChangeId) await c.query("SELECT 1 FROM ppo.engineering_changes WHERE workspace_id=$1 AND package_id=$2 AND id=$3 FOR UPDATE", [...scope, lockChangeId]);
  const q = async <T extends Record<string, unknown>>(sql: string) => (await c.query<T>(sql, scope)).rows;
  const inPackage = "JOIN ppo.engineering_changes c ON (c.workspace_id,c.id)=(t.workspace_id,t.change_id) WHERE t.workspace_id=$1 AND c.package_id=$2";
  const viaRevision = "JOIN ppo.change_revisions r ON (r.workspace_id,r.id)=(t.workspace_id,t.revision_id) JOIN ppo.engineering_changes c ON (c.workspace_id,c.id)=(r.workspace_id,r.change_id) WHERE t.workspace_id=$1 AND c.package_id=$2";
  const user = (alias: string, column: string, inner = false) => `${inner ? "" : "LEFT "}JOIN ppo.users ${alias} ON (${alias}.workspace_id,${alias}.id)=(t.workspace_id,t.${column})`;
  const bundle: Bundle = {
    changes: await q<ChangeRow>(`SELECT t.*,t.due::text,au.display_name AS author_name,nx.display_name AS next_owner_name FROM ppo.engineering_changes t ${user("au", "author_id", true)} ${user("nx", "next_owner_id")} WHERE t.workspace_id=$1 AND t.package_id=$2 ORDER BY t.change_number`),
    revisions: await q<RevisionRow>(`SELECT t.*,t.return_due::text,sb.display_name AS submitted_by_name,rb.display_name AS returned_by_name,ro.display_name AS return_owner_name FROM ppo.change_revisions t ${user("sb", "submitted_by")} ${user("rb", "returned_by")} ${user("ro", "return_owner_id")} ${inPackage} ORDER BY t.revision_number`),
    objects: await q<ObjectRow>(`SELECT t.*,ow.display_name AS owner_name FROM ppo.change_objects t ${user("ow", "owner_id")} ${viaRevision} ORDER BY t.sort_order,t.reference`),
    links: await q<LinkRow>(`SELECT t.revision_id,t.source_id,t.role,t.required,t.snapshot FROM ppo.change_revision_sources t ${viaRevision}`),
    retests: await q<RetestRow>(`SELECT t.*,t.due::text,ve.display_name AS verifier_name FROM ppo.change_retests t ${user("ve", "verifier_id")} ${viaRevision} ORDER BY t.sort_order,t.criterion`),
    attempts: await q<AttemptRow>(`SELECT t.*,t.corrective_due::text,rc.display_name AS recorded_by_name,co.display_name AS corrective_owner_name FROM ppo.change_retest_attempts t ${user("rc", "recorded_by", true)} ${user("co", "corrective_owner_id")} ${inPackage} ORDER BY t.attempt_number`),
    reviews: await q<ReviewRow>(`SELECT t.*,rv.display_name AS reviewer_name FROM ppo.change_reviews t ${user("rv", "reviewer_id", true)} ${inPackage} ORDER BY t.created_at,t.discipline`),
    decisions: await q<DecisionRow>(`SELECT t.*,de.display_name AS decided_by_name FROM ppo.change_decisions t ${user("de", "decided_by", true)} ${inPackage} ORDER BY t.decided_at`),
    prerequisites: await q<PrerequisiteRow>(`SELECT t.*,t.due::text,ow.display_name AS owner_name,rs.display_name AS resolved_by_name FROM ppo.change_prerequisites t ${user("ow", "owner_id")} ${user("rs", "resolved_by")} ${inPackage} ORDER BY t.kind`),
    handovers: await q<HandoverRow>(`SELECT t.*,t.due::text,ow.display_name AS owner_name,cb.display_name AS created_by_name FROM ppo.change_handovers t ${user("ow", "owner_id", true)} ${user("cb", "created_by", true)} ${inPackage} ORDER BY t.created_at,t.id`),
    submissions: await q<SubmissionRow>(`SELECT t.*,t.return_due::text,sb.display_name AS submitted_by_name,ob.display_name AS outcome_by_name,ro.display_name AS return_owner_name FROM ppo.change_submissions t ${user("sb", "submitted_by", true)} ${user("ob", "outcome_by")} ${user("ro", "return_owner_id")}
      JOIN ppo.change_handovers h ON (h.workspace_id,h.id)=(t.workspace_id,t.handover_id) JOIN ppo.engineering_changes c ON (c.workspace_id,c.id)=(h.workspace_id,h.change_id) WHERE t.workspace_id=$1 AND c.package_id=$2 ORDER BY t.submission_number`),
    checks: await q<CheckRow>(`SELECT t.*,cb.display_name AS checked_by_name FROM ppo.change_source_checks t ${user("cb", "checked_by", true)} ${inPackage} ORDER BY t.checked_at DESC`),
    closures: await q<ClosureRow>(`SELECT t.*,cb.display_name AS closed_by_name FROM ppo.change_closures t ${user("cb", "closed_by", true)} ${inPackage}`),
    overlaps: new Map(), resolved: new Map(),
  };
  await loadOverlaps(c, p, access, bundle);
  return assemble(bundle, sources, access);
}

// Other open or accepted changes, anywhere in this company, whose current revision includes the same
// typed object or rests on the same baseline. A change in a package this identity cannot read is named
// only as a restricted dependency: no title, no reference, and it blocks until its owner resolves it.
async function loadOverlaps(c: QueryClient, p: Principal, access: Access, bundle: Bundle) {
  if (!bundle.changes.length) return;
  const found = (
    await c.query<{ change_id: string; other_id: string; other_package: string; reference: string; title: string; stage: Stage; decision: TechnicalDecision | null; object_key: string; object_reference: string }>(
      `WITH current AS (
         SELECT c.id AS change_id,c.package_id,c.reference,c.title,c.stage,r.id AS revision_id FROM ppo.engineering_changes c
         JOIN ppo.change_revisions r ON (r.workspace_id,r.change_id,r.revision_number)=(c.workspace_id,c.id,c.current_revision) WHERE c.workspace_id=$1 AND c.company_id=$2 AND c.stage NOT IN ('Closed','Withdrawn')),
       keys AS (
         SELECT k.change_id,o.object_key,o.reference AS object_reference FROM current k JOIN ppo.change_objects o ON (o.workspace_id,o.revision_id)=($1,k.revision_id) WHERE o.disposition='Included'
         UNION SELECT k.change_id,'Baseline:'||s.source_id::text,(s.snapshot->>'reference')||' revision '||(s.snapshot->>'revision') FROM current k JOIN ppo.change_revision_sources s ON (s.workspace_id,s.revision_id)=($1,k.revision_id) WHERE s.role='Baseline')
       SELECT mine.change_id,other.change_id AS other_id,o.package_id AS other_package,o.reference,o.title,o.stage,
         (SELECT d.result FROM ppo.change_decisions d WHERE (d.workspace_id,d.revision_id)=($1,o.revision_id)) AS decision,mine.object_key,mine.object_reference
       FROM keys mine JOIN current m ON m.change_id=mine.change_id AND m.package_id=$3
       JOIN keys other ON other.object_key=mine.object_key AND other.change_id<>mine.change_id JOIN current o ON o.change_id=other.change_id
       ORDER BY o.reference,mine.object_key`,
      [p.workspace_id, access.pkg.company_id, access.pkg.id],
    )
  ).rows;
  const readable = new Map<string, boolean>([[access.pkg.id, true]]);
  for (const id of new Set(found.map((f) => f.other_package))) if (!readable.has(id)) readable.set(id, await engineeringRow(c, p, id).then(() => true, () => false));
  for (const f of found) {
    const list = bundle.overlaps.get(f.change_id) ?? [], seen = readable.get(f.other_package)!;
    let entry = list.find((o) => o.change_id === f.other_id);
    if (!entry) list.push((entry = { change_id: f.other_id, reference: seen ? f.reference : "Restricted change", title: seen ? f.title : "A change outside your access shares this scope", stage: f.stage, decision: f.decision ?? "None", shared: [], restricted: !seen }));
    if (seen) entry.shared.push({ object_key: f.object_key, reference: f.object_reference });
    bundle.overlaps.set(f.change_id, list);
  }
  const decided = (await c.query<{ change_id: string; other_change_id: string }>(
    "SELECT d.change_id,d.other_change_id FROM ppo.change_overlap_decisions d JOIN ppo.engineering_changes c ON (c.workspace_id,c.id)=(d.workspace_id,d.change_id) WHERE d.workspace_id=$1 AND c.package_id=$2", [p.workspace_id, access.pkg.id])).rows;
  for (const d of decided) bundle.resolved.set(d.change_id, (bundle.resolved.get(d.change_id) ?? new Set()).add(d.other_change_id));
}

const group = <T, K>(rows: T[], key: (row: T) => K) => rows.reduce((map, row) => map.set(key(row), [...(map.get(key(row)) ?? []), row]), new Map<K, T[]>());
function assemble(b: Bundle, sources: LiveSource[], access: Access) {
  const sourceById = new Map(sources.map((s) => [s.id, s])), revisions = group(b.revisions, (r) => r.change_id), objects = group(b.objects, (o) => o.revision_id),
    links = group(b.links, (l) => l.revision_id), retests = group(b.retests, (r) => r.revision_id), attempts = group(b.attempts, (a) => a.retest_id), reviews = group(b.reviews, (r) => r.revision_id),
    prerequisites = group(b.prerequisites, (x) => x.decision_id), handovers = group(b.handovers, (h) => h.change_id), submissions = group(b.submissions, (s) => s.handover_id), checks = group(b.checks, (k) => k.change_id);
  return b.changes.map((row) => {
    const all = revisions.get(row.id) ?? [], revision = all.find((r) => r.revision_number === row.current_revision)!,
      decision = b.decisions.find((d) => d.revision_id === revision.id) ?? null,
      liveLinks: SourceLink[] = (links.get(revision.id) ?? []).map((l) => {
        const s = sourceById.get(l.source_id);
        return { source_id: l.source_id, role: l.role, required: l.required, snapshot: l.snapshot, live: s ? { use: s.use, successor_id: s.successor_id, content_hash: s.content_hash, readable: s.readable } : null };
      }),
      baseline = liveLinks.find((l) => l.role === "Baseline") ?? null,
      // The revised release this change asked for: a newer issue of the baseline document, observed upstream after the proposal named it.
      issued = baseline && revision.proposed_revision ? sources.find((s) => s.kind === sourceById.get(baseline.source_id)?.kind && s.reference === baseline.snapshot.reference && s.revision === revision.proposed_revision && s.use === "Current") ?? null : null,
      condition = sourceCondition(liveLinks, issued?.id ?? null),
      definitions = retests.get(revision.id) ?? [],
      verification = definitions.map((r) => ({ retest: r, attempts: attempts.get(r.id) ?? [], state: verificationState(r, attempts.get(r.id) ?? [], decision?.result === "Accepted") })),
      requests = (handovers.get(row.id) ?? []).map((h) => ({ handover: h, submissions: submissions.get(h.id) ?? [], stale: h.revision_id !== revision.id })),
      overlaps = b.overlaps.get(row.id) ?? [], resolved = b.resolved.get(row.id) ?? new Set<string>(),
      stage = row.stage,
      facts: ChangeFacts = {
        stage, decision: decision?.result ?? "None", source: condition.condition, return_kind: revision.return_kind,
        evidence_needed: revision.categories.some((k) => k.status === "EvidenceNeeded"),
        prerequisites: decision ? (prerequisites.get(decision.id) ?? []).map(({ kind, applicability: a, state }) => ({ kind, applicability: a, state })) : [],
        requests: requests.filter((r) => !r.stale || r.handover.state === "Accepted").map((r) => ({ id: r.handover.id, purpose: r.handover.purpose, destination: r.handover.destination, state: r.handover.state })),
        verification: verification.map((v) => v.state), requires_revised_release: revision.requires_revised_release, revised_release_issued: !!issued,
        overlap_conflict: overlapsBlockingHandover(overlaps, resolved).length > 0, context_kind: access.pkg.context_kind,
      };
    return {
      row, revision, revisions: all, document: documentOf(revision, objects.get(revision.id) ?? [], links.get(revision.id) ?? [], definitions), objects: objects.get(revision.id) ?? [],
      links: liveLinks, baseline, issued, condition, applicability: applicability(condition.condition), reviews: reviews.get(revision.id) ?? [], all_reviews: all.flatMap((r) => reviews.get(r.id) ?? []),
      decision, decisions: b.decisions.filter((d) => d.change_id === row.id), prerequisites: decision ? prerequisites.get(decision.id) ?? [] : [], requests, verification,
      checks: checks.get(row.id) ?? [], closure: b.closures.find((k) => k.change_id === row.id) ?? null, overlaps, resolved, facts,
      attention: attention(facts), next: nextAction(facts), progress: implementationProgress(facts),
    };
  });
}
export function verificationState(r: RetestDefinition, attempts: AttemptRow[], accepted: boolean): VerificationState {
  const last = attempts.at(-1);
  if (last) return last.result;
  return accepted ? (r.verifier_id ? "AwaitingEvidence" : "Required") : "Required";
}
export function documentOf(r: RevisionRow, objects: ObjectRow[], links: LinkRow[], retests: RetestRow[]): ProposalDocument {
  return {
    rationale: r.rationale, proposed_reference: r.proposed_reference, proposed_revision: r.proposed_revision, scope_statement: r.scope_statement, comparison: r.comparison, options: r.options,
    selected_option: r.selected_option, categories: r.categories, costs: r.costs, dates: r.dates, requires_revised_release: r.requires_revised_release,
    objects: objects.map(({ revision_id: _r, sort_order: _s, owner_name: _n, ...o }) => { void [_r, _s, _n]; return o; }),
    sources: links.map((l) => ({ source_id: l.source_id, role: l.role, required: l.required })),
    retests: retests.map(({ revision_id: _r, sort_order: _s, verifier_name: _n, ...t }) => { void [_r, _s, _n]; return t; }),
  };
}
export const stamp = iso;

// Everyone who ever authored or changed the technical content of this change. None of them may review,
// decide, verify or close it, and reassigning the change never removes a name from this list.
export async function contributors(c: QueryClient, p: Principal, change: ChangeRow) {
  const rows = (await c.query<{ created_by: string }>(
    "SELECT DISTINCT created_by FROM ppo.change_events WHERE workspace_id=$1 AND change_id=$2 AND event_type IN ('ChangeCreated','ProposalSaved','ProposalSubmitted','RevisionCreated','AssessmentStarted')", [p.workspace_id, change.id])).rows;
  return new Set([change.author_id, change.created_by, ...rows.map((r) => r.created_by)]);
}

const tables = {
  Change: "engineering_changes", Revision: "change_revisions", Review: "change_reviews", Decision: "change_decisions", Prerequisite: "change_prerequisites", Handover: "change_handovers",
  Submission: "change_submissions", RetestAttempt: "change_retest_attempts", SourceCheck: "change_source_checks", OverlapDecision: "change_overlap_decisions", Closure: "change_closures",
} as const;
export type SubjectType = keyof typeof tables;
// History is written in the transaction that made the change, with the exact row as it then stood.
// Cost amounts stay out of the snapshot: history is read by people who may not see commercial detail.
export async function record(
  c: PoolClient, p: Principal, access: Access, command: { operation_id: string; reason: string },
  e: { change_id: string; subject_type: SubjectType; subject_id: string; event_type: string; note?: string | null },
) {
  await c.query(
    `INSERT INTO ppo.change_events(id,workspace_id,company_id,package_id,change_id,subject_type,subject_id,change_version,event_type,reason,note,snapshot,operation_id,created_by)
     SELECT $1,ch.workspace_id,ch.company_id,ch.package_id,ch.id,$2,t.id,ch.version,$3,$4,$5,to_jsonb(t)-'costs'-'payload',$6,$7
     FROM ppo.${tables[e.subject_type]} t JOIN ppo.engineering_changes ch ON (ch.workspace_id,ch.id)=(t.workspace_id,$8::uuid) WHERE t.workspace_id=$9 AND t.id=$10`,
    [randomUUID(), e.subject_type, e.event_type, command.reason, e.note ?? null, command.operation_id, p.actor_id, e.change_id, p.workspace_id, e.subject_id],
  );
}
// Every accepted command advances the change, so a closure or a decision made against version N can
// never race past a test result, a receiving outcome or an edit recorded after N.
export async function touch(c: PoolClient, p: Principal, changeId: string, set = "", values: unknown[] = []) {
  const row = (await c.query<{ id: string; version: number; state: string; updated_at: Date }>(
    `UPDATE ppo.engineering_changes SET version=version+1,updated_at=clock_timestamp(),updated_by=$3${set ? `,${set}` : ""} WHERE workspace_id=$1 AND id=$2 RETURNING id,version,stage AS state,updated_at`,
    [p.workspace_id, changeId, p.actor_id, ...values])).rows[0];
  if (!row) throw unavailable();
  return row;
}
