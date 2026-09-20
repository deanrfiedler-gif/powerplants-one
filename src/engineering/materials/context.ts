import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import type { Capability, QueryClient } from "../../platform/permissions";
import { uuid } from "../../shared/validation";
import { engineeringRow } from "../service";
import {
  convertQuantity, formatQuantity, lineReadiness, parseQuantity,
  type CommercialState, type Conversion, type ConversionResult, type KitRole, type MappingCondition, type Policy, type PolicyGrant, type ReleasePurpose, type SourceRef, type SourceUse, type SubstitutionState, type Unit,
} from "./model";

export type PackageRow = Awaited<ReturnType<typeof engineeringRow>>;
const duties = {
  edit: "engineering.edit",
  review: "engineering.material.review",
  release: "engineering.material.release",
  receive: "engineering.material.receive",
  source: "engineering.material.source",
  commercial: "project.edit",
} as const satisfies Record<string, Capability>;
export type Duty = keyof typeof duties;
export type Access = { pkg: PackageRow; site_name: string | null; site_timezone: string | null; can: Record<Duty, boolean>; policy: Policy };

// Every read, count, command, export and receipt recovery starts here. engineeringRow already refuses a
// package outside the actor's workspace, company, site, customer and linked Project/Opportunity scope
// with "unavailable", so a foreign package is indistinguishable from a missing one. Holding
// engineering.edit is never review, release or receiving authority: each duty is its own capability
// and, separately, its own entry in the versioned policy.
export async function materialsAccess(c: QueryClient, p: Principal, packageId: string): Promise<Access> {
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
    await c.query<{ id: string; policy_version: number; allow_reviewer_release_overlap: boolean; grants: PolicyGrant[] }>(
      `SELECT id,policy_version,allow_reviewer_release_overlap,grants FROM ppo.material_policies
       WHERE workspace_id=$1 AND company_id=$2 AND (site_id IS NULL OR site_id=$3::uuid) AND effective_from<=clock_timestamp()
       ORDER BY policy_version DESC LIMIT 1`,
      [p.workspace_id, pkg.company_id, pkg.site_id],
    )
  ).rows[0];
  return {
    pkg,
    site_name: site?.display_name ?? null,
    site_timezone: site?.timezone ?? null,
    can: Object.fromEntries(Object.entries(duties).map(([duty, capability]) => [duty, held.has(capability)])) as Record<Duty, boolean>,
    policy: policy ?? null,
  };
}
const dutyRefusals: Record<Duty, string> = {
  edit: "This identity may read these materials but cannot change them.",
  review: "Technical review is a separate duty. This identity does not hold it for this company and site.",
  release: "Material release authority is a separate duty. This identity does not hold it for this company and site.",
  receive: "Receiving decisions belong to Supply Chain. This identity does not hold that duty for this company and site.",
  source: "Sources are observed through the synthetic upstream adapter, which this identity does not operate.",
  commercial: "A commercial or scope decision belongs to the Project's commercial coordinator.",
};
export function requireDuty(access: Access, duty: Duty) {
  if (!access.can[duty]) throw new AppError(403, "Forbidden", dutyRefusals[duty]);
}
export const refuse = (code: string, message: string, status = 422) => new AppError(status, code, message);
export function currentVersion(actual: number, expected: number) {
  if (actual !== expected) throw new AppError(409, "VersionConflict", "This record changed while you were working. Your entries are retained; review the latest version before saving again.");
}
export const sha256 = (value: unknown) => createHash("sha256").update(typeof value === "string" ? value : canonical(value)).digest("hex");

// ---------------------------------------------------------------------------------------------
// The stored line, column for column. Dates that a screen shows as dates are read as text; numerics arrive as exact strings.
export type LineRecord = {
  id: string; workspace_id: string; company_id: string; set_id: string; version: number; created_at: Date; created_by: string; updated_at: Date; updated_by: string;
  line_number: string; content_revision: number; content_hash: string; description: string; category: string; specification: string; discipline: string;
  system_name: string; location: string; served_areas: string[]; quantity: string; unit: Unit; quantity_basis: string; required_by: string | null;
  purpose: ReleasePurpose; manufacturer: string | null; model: string | null; supplier_part: string | null; product_ref: string | null; kit_role: KitRole;
  parent_line_id: string | null; dependency_group: string | null; drawing_source_id: string | null; basis_source_id: string | null;
  scope_decision_needed: boolean; scope_decision_owner_id: string | null; mapping: MappingCondition; mapping_provider: string | null;
  mapping_configuration: string | null; mapping_entity: string | null; mapping_item_key: string | null; mapping_item_description: string | null;
  mapping_version: number; mapping_observed_at: Date | null; mapping_verified_by: string | null; mapping_owner_id: string | null;
  mapping_candidates: { item_key: string; description: string; discriminator: string }[]; mapping_rationale: string | null; target_unit: Unit | null;
  conversion_numerator: number | null; conversion_denominator: number | null; whole_units_only: boolean; target_precision: number;
  conversion_evidence: string | null; overage_basis: string | null; author_id: string; next_owner_id: string; next_action: string; action_due: string | null;
  removed_at: Date | null; removed_reason: string | null;
};
type LineRow = LineRecord;
// The technical content of a line: what a review, a substitution decision or a release relies on.
// Coordination (next action, its owner and date, the required-by date) is deliberately outside it, so
// chasing an action never invalidates a decision, while any change of requirement, product, quantity,
// source, dependency or item binding always does.
const contentFields = [
  "description", "category", "specification", "discipline", "system_name", "location", "served_areas", "unit", "quantity_basis", "purpose",
  "manufacturer", "model", "supplier_part", "product_ref", "kit_role", "parent_line_id", "dependency_group", "drawing_source_id", "basis_source_id",
  "scope_decision_needed", "mapping", "mapping_provider", "mapping_configuration", "mapping_entity", "mapping_item_key", "mapping_item_description",
  "mapping_candidates", "mapping_rationale", "target_unit", "conversion_numerator", "conversion_denominator", "whole_units_only", "target_precision",
  "conversion_evidence", "overage_basis",
] as const;
export function lineContentHash(row: Partial<LineRecord> & Pick<LineRecord, "quantity">) {
  return sha256({ quantity: formatQuantity(parseQuantity(row.quantity)!), ...Object.fromEntries(contentFields.map((f) => [f, row[f] ?? null])) });
}
export function lineConversion(row: Pick<LineRow, "quantity" | "unit" | "target_unit" | "conversion_numerator" | "conversion_denominator" | "whole_units_only" | "target_precision" | "conversion_evidence" | "overage_basis">, quantity = row.quantity): ConversionResult | null {
  if (!row.target_unit) return null;
  const conversion: Conversion = {
    design_unit: row.unit, target_unit: row.target_unit,
    numerator: row.conversion_numerator === null ? null : String(row.conversion_numerator),
    denominator: row.conversion_denominator === null ? null : String(row.conversion_denominator),
    whole_units_only: row.whole_units_only, target_precision: row.target_precision,
    evidence: row.conversion_evidence, overage_basis: row.overage_basis,
  };
  return convertQuantity(formatQuantity(parseQuantity(quantity)!), conversion);
}

export async function loadSources(c: QueryClient, p: Principal, access: Access) {
  const rows = (
    await c.query<Omit<SourceRef, "use" | "observed_at" | "successor_id"> & { observed_at: Date; completeness: string; change: SourceUse | null; successor_id: string | null; content: string | null; change_reason: string | null; changed_at: Date | null }>(
      `SELECT s.id,s.kind,s.reference,s.title,s.revision,s.file_version,s.content_hash,s.permitted_purpose,s.observed_at,s.adapter,s.restricted,s.completeness,s.content,
        ch.change,ch.successor_id,ch.reason AS change_reason,ch.created_at AS changed_at
       FROM ppo.material_sources s LEFT JOIN ppo.material_source_changes ch ON (ch.workspace_id,ch.source_id)=(s.workspace_id,s.id)
       WHERE s.workspace_id=$1 AND s.package_id=$2 ORDER BY s.kind,s.reference,s.created_at`,
      [p.workspace_id, access.pkg.id],
    )
  ).rows;
  // A restricted source shows its identity and hash to everyone in scope, and its bytes only to the duties that decide on it.
  const readable = access.can.edit || access.can.review || access.can.release || access.can.source;
  return rows.map(({ content, completeness, change, observed_at, change_reason, changed_at, ...s }) => ({
    ...s,
    observed_at: observed_at.toISOString(),
    use: (change ?? (completeness === "Unavailable" ? "Unavailable" : "Current")) as SourceUse,
    change_reason,
    changed_at: changed_at?.toISOString() ?? null,
    content: s.restricted && !readable ? null : content,
    content_withheld: s.restricted && !readable,
  }));
}
export type LoadedSource = Awaited<ReturnType<typeof loadSources>>[number];

export async function loadLines(c: QueryClient, p: Principal, setId: string, sources: LoadedSource[]) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const rows = (
    await c.query<LineRow & { author_name: string; next_owner_name: string; scope_decision_owner: string | null; released_quantity: string; locked: boolean; reviewed: boolean }>(
      `SELECT l.*,l.required_by::text,l.action_due::text,au.display_name AS author_name,nx.display_name AS next_owner_name,sd.display_name AS scope_decision_owner,
        coalesce((SELECT sum(rl.quantity) FROM ppo.material_release_lines rl JOIN ppo.material_releases r ON (r.workspace_id,r.id)=(rl.workspace_id,rl.release_id)
          WHERE (rl.workspace_id,rl.line_id)=(l.workspace_id,l.id) AND r.issue_state='Issued' AND r.withdrawn_at IS NULL AND r.superseded_by IS NULL),0)::text AS released_quantity,
        EXISTS(SELECT 1 FROM ppo.material_release_lines rl JOIN ppo.material_releases r ON (r.workspace_id,r.id)=(rl.workspace_id,rl.release_id)
          WHERE (rl.workspace_id,rl.line_id)=(l.workspace_id,l.id) AND r.issue_state<>'Issued' AND r.review_state IN ('Submitted','Held','TechnicallyReviewed')) AS locked,
        EXISTS(SELECT 1 FROM ppo.material_release_lines rl JOIN ppo.material_releases r ON (r.workspace_id,r.id)=(rl.workspace_id,rl.release_id)
          WHERE (rl.workspace_id,rl.line_id)=(l.workspace_id,l.id) AND rl.content_hash=l.content_hash AND r.review_state='TechnicallyReviewed') AS reviewed
       FROM ppo.material_lines l JOIN ppo.users au ON (au.workspace_id,au.id)=(l.workspace_id,l.author_id)
       JOIN ppo.users nx ON (nx.workspace_id,nx.id)=(l.workspace_id,l.next_owner_id)
       LEFT JOIN ppo.users sd ON (sd.workspace_id,sd.id)=(l.workspace_id,l.scope_decision_owner_id)
       WHERE l.workspace_id=$1 AND l.set_id=$2 ORDER BY l.line_number`,
      [p.workspace_id, setId],
    )
  ).rows;
  const substitutions = (
    await c.query<{ id: string; line_id: string; state: SubstitutionState; candidate_code: string; candidate_description: string; commercial_state: CommercialState; criteria: { mandatory: boolean; result: string }[]; adopted_at: Date | null; proposer_id: string; submitted_hash: string | null; decided_by: string | null; adopted_content_revision: number | null }>(
      // The live proposal of a line is its newest one; a returned proposal that has a successor is history.
      `SELECT DISTINCT ON (s.line_id) s.id,s.line_id,s.state,s.candidate_code,s.candidate_description,s.commercial_state,s.criteria,s.adopted_at,s.proposer_id,s.submitted_hash,s.decided_by,s.adopted_content_revision
       FROM ppo.material_substitutions s WHERE s.workspace_id=$1 AND s.set_id=$2 ORDER BY s.line_id,s.created_at DESC,s.id DESC`,
      [p.workspace_id, setId],
    )
  ).rows;
  const proposals = new Map(substitutions.map((s) => [s.line_id, s]));
  return rows.map((row) => {
    const drawing = row.drawing_source_id ? byId.get(row.drawing_source_id) : undefined,
      basis = row.basis_source_id ? byId.get(row.basis_source_id) : undefined,
      proposal = proposals.get(row.id),
      open = !!proposal && ["Draft", "Submitted", "Returned", "Held"].includes(proposal.state),
      // The worse of the two linked sources decides: a current drawing cannot hide a withdrawn basis.
      uses = [drawing?.use, basis?.use].filter(Boolean) as SourceUse[],
      source_use = !drawing ? ("Missing" as const) : (["Withdrawn", "Superseded", "Unavailable"] as const).find((u) => uses.includes(u)) ?? "Current",
      quantity = formatQuantity(parseQuantity(row.quantity)!),
      released_quantity = formatQuantity(parseQuantity(row.released_quantity)!),
      conversion = lineConversion(row);
    const readiness = lineReadiness({
      complete: !!basis,
      source_use,
      mapping: row.mapping,
      // A rejected candidate leaves the original requirement exactly as it was.
      substitution: proposal && proposal.state !== "Rejected"
        ? { state: proposal.state, evidence_outstanding: proposal.criteria.some((k) => k.mandatory && k.result !== "Meets"), commercial: proposal.commercial_state }
        : null,
      scope_decision_needed: row.scope_decision_needed,
      reviewed: row.reviewed,
      released: parseQuantity(released_quantity)! >= parseQuantity(quantity)!,
    });
    return {
      row,
      quantity, released_quantity, conversion, drawing, basis, readiness, locked: row.locked,
      proposal: proposal ? { ...proposal, open } : null,
      // What a procurement release additionally needs from this line, beyond being ready for review.
      purpose_supported: [drawing, basis].every((s) => s?.permitted_purpose === "Procurement"),
      mapping_ready: row.mapping === "Verified",
    };
  });
}
export type LoadedLine = Awaited<ReturnType<typeof loadLines>>[number];

export async function setRow(c: QueryClient, p: Principal, access: Access, setId: string, lock = false) {
  const set = (
    await c.query<{ id: string; version: number; set_code: string; revision: number; title: string; owner_id: string; company_id: string; package_id: string; updated_at: Date }>(
      `SELECT * FROM ppo.material_sets WHERE workspace_id=$1 AND package_id=$2 AND id=$3${lock ? " FOR UPDATE" : ""}`,
      [p.workspace_id, access.pkg.id, uuid(setId, "set_id")],
    )
  ).rows[0];
  if (!set) throw unavailable();
  return set;
}

// A named person must be able to see this package; a name typed into a form is never authority.
export async function eligiblePerson(c: QueryClient, p: Principal, access: Access, userId: string, field: string, capability: Capability = "engineering.read") {
  const user = (await c.query<{ id: string; display_name: string }>("SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active", [p.workspace_id, userId])).rows[0];
  if (!user) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field, message: "Choose an active person in this workspace." }]);
  const candidate = { ...p, actor_id: user.id, display_name: user.display_name };
  try {
    const theirs = await materialsAccess(c, candidate, access.pkg.id);
    const duty = (Object.entries(duties).find(([, cap]) => cap === capability)?.[0] ?? null) as Duty | null;
    if (duty && !theirs.can[duty]) throw unavailable();
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status))
      throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field, message: `${user.display_name} cannot act on this package with their current access.` }]);
    throw e;
  }
  return user;
}

const tables = {
  MaterialSet: "material_sets", MaterialSource: "material_sources", MaterialLine: "material_lines", MaterialSubstitution: "material_substitutions",
  MaterialRelease: "material_releases", MaterialHandover: "material_handovers", MaterialImpact: "material_impacts",
} as const;
export type SubjectType = keyof typeof tables;
// History is written in the transaction that made the change, with the exact row as it then stood.
export async function record(
  c: PoolClient, p: Principal, access: Access, command: { operation_id: string; reason: string },
  e: { set_id: string | null; subject_type: SubjectType; subject_id: string; event_type: string; note?: string | null },
) {
  await c.query(
    `INSERT INTO ppo.material_events(id,workspace_id,company_id,package_id,set_id,subject_type,subject_id,subject_version,event_type,reason,note,snapshot,operation_id,created_by)
     SELECT $1,t.workspace_id,t.company_id,$2,$3,$4,t.id,t.version,$5,$6,$7,to_jsonb(t)-'content',$8,$9 FROM ppo.${tables[e.subject_type]} t WHERE t.workspace_id=$10 AND t.id=$11`,
    [randomUUID(), access.pkg.id, e.set_id, e.subject_type, e.event_type, command.reason, e.note ?? null, command.operation_id, p.actor_id, p.workspace_id, e.subject_id],
  );
}
