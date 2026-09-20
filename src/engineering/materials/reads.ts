import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { unavailable } from "../../platform/errors";
import type { QueryClient } from "../../platform/permissions";
import { choice, invalid, object, optionalId, uuid } from "../../shared/validation";
import { disciplines } from "../model";
import { listEngineering } from "../service";
import { loadLines, loadSources, materialsAccess, type Access, type LoadedLine, type LoadedSource } from "./context";
import { selection as parseSelection } from "./validation";
import {
  acceptanceBlockers, csv, currentUse, demandTotals, label, manifestDifferences, mappingConditions, parseQuantity, formatQuantity,
  policyAllows, quantityText, releaseBlockers, releasePurposes,
  type Blocker, type CommercialState, type Criterion, type HandoverState, type IssueState, type Manifest, type MaterialLine, type ReleasePurpose, type ReviewState, type ScopeLine, type SourceRef, type SourceUse, type SubstitutionState,
} from "./model";

const sourceRef = (s: LoadedSource | undefined): SourceRef | null =>
  s ? { id: s.id, kind: s.kind, reference: s.reference, title: s.title, revision: s.revision, file_version: s.file_version, content_hash: s.content_hash, permitted_purpose: s.permitted_purpose, observed_at: s.observed_at, use: s.use, adapter: s.adapter, successor_id: s.successor_id, restricted: s.restricted } : null;
function present(l: LoadedLine): MaterialLine {
  const r = l.row;
  return {
    id: l.row.id, version: l.row.version, content_revision: l.row.content_revision, content_hash: l.row.content_hash, line_number: l.row.line_number,
    description: r.description, category: r.category, specification: r.specification, discipline: r.discipline, system_name: r.system_name,
    location: r.location, served_areas: r.served_areas, quantity: l.quantity, unit: l.row.unit, quantity_basis: r.quantity_basis,
    required_by: r.required_by, purpose: r.purpose, manufacturer: r.manufacturer, model: r.model, supplier_part: r.supplier_part, product_ref: r.product_ref,
    kit_role: r.kit_role, parent_line_id: r.parent_line_id, dependency_group: r.dependency_group, scope_decision_needed: r.scope_decision_needed,
    scope_decision_owner: r.scope_decision_owner, author_id: l.row.author_id, author_name: r.author_name, next_owner_id: r.next_owner_id,
    next_owner_name: r.next_owner_name, next_action: r.next_action, action_due: r.action_due, drawing: sourceRef(l.drawing), basis: sourceRef(l.basis),
    mapping: r.mapping, mapping_item: r.mapping_item_key, released_quantity: l.released_quantity, removed: !!l.row.removed_at, readiness: l.readiness,
    substitution: l.proposal && l.proposal.state !== "Rejected" && !(l.proposal.state === "Accepted" && l.proposal.adopted_at)
      ? { id: l.proposal.id, state: l.proposal.state, candidate_code: l.proposal.candidate_code } : null,
    updated_at: l.row.updated_at.toISOString(),
  };
}
const binding = (l: LoadedLine) => {
  const r = l.row;
  return {
    condition: r.mapping, provider: r.mapping_provider, configuration: r.mapping_configuration, entity: r.mapping_entity, item_key: r.mapping_item_key,
    item_description: r.mapping_item_description, version: r.mapping_version, observed_at: r.mapping_observed_at?.toISOString() ?? null,
    candidates: r.mapping_candidates, rationale: r.mapping_rationale, owner_id: r.mapping_owner_id, target_unit: l.row.target_unit,
    conversion_numerator: l.row.conversion_numerator, conversion_denominator: l.row.conversion_denominator, whole_units_only: l.row.whole_units_only,
    target_precision: l.row.target_precision, conversion_evidence: l.row.conversion_evidence, overage_basis: l.row.overage_basis, conversion: l.conversion,
  };
};
export const scopeLine = (l: LoadedLine): ScopeLine => ({
  id: l.row.id, line_number: l.row.line_number, description: String(l.row.description), quantity: l.quantity, unit: l.row.unit,
  kit_role: l.row.kit_role as ScopeLine["kit_role"], parent_line_id: l.row.parent_line_id as string | null, dependency_group: l.row.dependency_group as string | null,
  released_quantity: l.released_quantity, readiness: l.readiness, purpose_supported: l.purpose_supported, mapping_ready: l.mapping_ready,
  conversion: l.conversion, substitution_open: !!l.proposal?.open, content_revision: l.row.content_revision,
});

// ---------------------------------------------------------------------------------------------
type SetSummary = { id: string; version: number; code: string; revision: number; title: string; owner_id: string };
async function sets(c: QueryClient, p: Principal, access: Access): Promise<SetSummary[]> {
  return (await c.query<SetSummary>("SELECT id,version,set_code AS code,revision,title,owner_id FROM ppo.material_sets WHERE workspace_id=$1 AND package_id=$2 ORDER BY set_code", [p.workspace_id, access.pkg.id])).rows;
}
async function frame(c: QueryClient, p: Principal, packageId: string, setId: string | null) {
  const access = await materialsAccess(c, p, packageId),
    all = await sets(c, p, access),
    set = setId ? all.find((s) => s.id === setId) : all[0];
  if (setId && !set) throw unavailable();
  const sources = await loadSources(c, p, access),
    lines = set ? await loadLines(c, p, set.id, sources) : [],
    live = lines.filter((l) => !l.row.removed_at);
  const open = live.filter((l) => l.proposal?.open).length,
    released = live.filter((l) => parseQuantity(l.released_quantity)! > 0n).length;
  return {
    access, sets: all, set, sources, lines, live,
    shell: {
      package: {
        id: access.pkg.id, reference: access.pkg.display_number, title: access.pkg.title, discipline: access.pkg.discipline, context_kind: access.pkg.context_kind,
        context_title: access.pkg.context_title, context_reference: access.pkg.context_reference, context_id: access.pkg.context_id,
        customer_name: access.pkg.customer_name, site_name: access.site_name,
      },
      sets: all.map(({ id, code, revision, title }) => ({ id, code, revision, title })),
      set: set ? { ...set, status: !released ? "Draft" : released === live.length && live.every((l) => l.released_quantity === l.quantity) ? "Released" : "Partly released" } : null,
      can: access.can,
      policy: { configured: !!access.policy, version: access.policy?.policy_version ?? null },
      // The menu badge: proposals still waiting on someone. It is a count of this set, never a guess.
      menu: { substitutions_open: set ? open : null },
      synthetic: true as const,
      observed_at: new Date().toISOString(),
    },
  };
}
const setParam = (q: Record<string, unknown>) => optionalId(q.set === "" ? undefined : q.set, "set");

const sorts = ["line", "description", "quantity", "drawing", "mapping", "readiness", "owner", "required_by"] as const;
export async function readRegister(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set", "view", "q", "discipline", "owner_id", "mapping", "substitution", "readiness", "removed", "sort", "dir", "page", "page_size"]),
    view = choice(q.view ?? "all", "view", ["all", "ready", "attention"] as const),
    text = q.q ?? "",
    page = Number(q.page ?? 1), size = Number(q.page_size ?? 25);
  if (typeof text !== "string" || text.length > 200) invalid("q", "Search up to 200 characters.");
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(size) || size < 1 || size > 100) invalid("page", "Use a page from 1 and a page size from 1 to 100.");
  const discipline = q.discipline ? choice(q.discipline, "discipline", disciplines) : null,
    owner = optionalId(q.owner_id || undefined, "owner_id"),
    mapping = q.mapping ? choice(q.mapping, "mapping", mappingConditions) : null,
    substitution = choice(q.substitution ?? "any", "substitution", ["any", "proposed", "none"] as const),
    readiness = typeof q.readiness === "string" && q.readiness ? q.readiness : null,
    removed = choice(q.removed ?? "false", "removed", ["true", "false"] as const) === "true",
    sort = choice(q.sort ?? "line", "sort", sorts),
    dir = choice(q.dir ?? "asc", "dir", ["asc", "desc"] as const);
  const f = await frame(database(), p, packageId, setParam(q)),
    scope = removed ? f.lines : f.live,
    needle = (text as string).trim().toLowerCase();
  // Tabs, conditions and search narrow the same permission-scoped set, so a count can never disagree with its rows.
  const conditioned = scope.map(present).filter((l) =>
    (!discipline || l.discipline === discipline) && (!owner || l.next_owner_id === owner) && (!mapping || l.mapping === mapping) &&
    (substitution === "any" || (substitution === "proposed") === !!l.substitution) && (!readiness || l.readiness.code === readiness) &&
    (!needle || [l.line_number, l.description, l.manufacturer, l.model, l.supplier_part, l.product_ref, l.mapping_item, l.drawing?.reference, l.location, l.system_name].some((v) => v?.toLowerCase().includes(needle))));
  const tab = (l: MaterialLine, v: typeof view) => v === "all" || (v === "attention" ? l.readiness.attention : l.readiness.code === "ReadyForReview");
  const rows = conditioned.filter((l) => tab(l, view));
  const key = (l: MaterialLine): string | bigint => ({
    line: l.line_number, description: l.description.toLowerCase(), quantity: parseQuantity(l.quantity)!, drawing: l.drawing ? `${l.drawing.reference} ${l.drawing.revision}` : "",
    mapping: l.mapping, readiness: l.readiness.label, owner: l.next_owner_name.toLowerCase(), required_by: l.required_by ?? "9999",
  })[sort];
  rows.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : a.line_number.localeCompare(b.line_number)) * (dir === "asc" ? 1 : -1); });
  const attention = f.live.map(present).filter((l) => l.readiness.attention);
  const latest = f.set ? await releaseHeads(database(), p, f.set.id) : null;
  return {
    ...f.shell,
    criteria: { view, q: needle, discipline, owner_id: owner, mapping, substitution, readiness, removed, sort, dir },
    counts: {
      scope: "MaterialSet" as const, conditioned: needle !== "" || !!(discipline || owner || mapping || readiness) || substitution !== "any",
      all: conditioned.length, ready: conditioned.filter((l) => tab(l, "ready")).length, attention: conditioned.filter((l) => tab(l, "attention")).length,
      set_total: f.live.length, set_attention: attention.length,
    },
    items: rows.slice((page - 1) * size, page * size), total: rows.length, page, page_size: size,
    totals: demandTotals(f.live.map(scopeLine)),
    footer: latest,
    options: {
      disciplines: [...new Set(f.live.map((l) => String(l.row.discipline)))].sort(),
      owners: [...new Map(f.live.map((l) => [String(l.row.next_owner_id), String(l.row.next_owner_name)]))].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
      readiness: [...new Map(f.live.map((l) => [l.readiness.code, l.readiness.label]))].map(([code, text]) => ({ code, label: text })),
    },
    completeness: "Complete" as const,
  };
}
async function releaseHeads(c: QueryClient, p: Principal, setId: string) {
  const release = (await c.query<{ release_number: number; issue_state: string; review_state: string; withdrawn_at: Date | null }>(
    "SELECT release_number,issue_state,review_state,withdrawn_at FROM ppo.material_releases WHERE workspace_id=$1 AND set_id=$2 AND review_state<>'Cancelled' ORDER BY release_number DESC LIMIT 1", [p.workspace_id, setId])).rows[0];
  const handover = (await c.query<{ state: string; revision: number }>(
    "SELECT state,revision FROM ppo.material_handovers WHERE workspace_id=$1 AND set_id=$2 ORDER BY created_at DESC LIMIT 1", [p.workspace_id, setId])).rows[0];
  return {
    technical_release: !release ? "Not issued" : release.withdrawn_at ? `Release ${release.release_number} withdrawn` : release.issue_state === "Issued" ? `Release ${release.release_number} issued` : `Release ${release.release_number} ${label(release.issue_state === "Authorised" ? "Authorised" : release.review_state).toLowerCase()}, not issued`,
    supply_handover: handover ? `${label(handover.state)} (revision ${handover.revision})` : "Not prepared",
  };
}

// Form choices: people who hold engineering.read where this package lives. The save still checks each named person in full.
export async function readPeople(p: Principal, packageId: string, query: unknown) {
  object(query, []);
  const c = database(), access = await materialsAccess(c, p, packageId);
  const rows = (await c.query<{ id: string; display_name: string; capabilities: string[] }>(
    `SELECT u.id,u.display_name,array_agg(DISTINCT g.capability ORDER BY g.capability) AS capabilities FROM ppo.users u JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(u.workspace_id,u.id)
     WHERE u.workspace_id=$1 AND u.active AND g.capability IN ('engineering.read','engineering.edit','engineering.material.receive','project.edit')
     AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
     AND (g.scope_type='Workspace' OR (g.company_id=$2 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$3::uuid))))
     GROUP BY u.id,u.display_name HAVING 'engineering.read'=ANY(array_agg(g.capability)) ORDER BY u.display_name,u.id LIMIT 100`,
    [p.workspace_id, access.pkg.company_id, access.pkg.site_id])).rows;
  const receivers = new Set(access.policy?.grants.filter((g) => g.role === "SupplyReceiver").map((g) => g.actor_id));
  return { items: rows.map((r) => ({ id: r.id, name: r.display_name, author: r.capabilities.includes("engineering.edit"), commercial: r.capabilities.includes("project.edit"), receiver: r.capabilities.includes("engineering.material.receive") && receivers.has(r.id) })) };
}

export type SubstitutionRecord = {
  id: string; version: number; set_id: string; line_id: string; line_content_revision: number; line_content_hash: string; original_code: string; original_description: string;
  candidate_code: string; candidate_description: string; candidate_manufacturer: string; candidate_revision: string; candidate_item_key: string | null; reason: string;
  scope_quantity: string; criteria: Criterion[]; impacts: { area: string; effect: string; owner: string }[]; state: SubstitutionState; proposer_id: string;
  submitted_hash: string | null; submitted_at: Date | null; decided_by: string | null; decided_at: Date | null; decision_rationale: string | null; decision_owner_id: string | null;
  decision_due: string | null; policy_version: number | null; commercial_state: CommercialState; commercial_note: string | null; commercial_owner_id: string | null;
  commercial_decided_at: Date | null; predecessor_id: string | null; adopted_at: Date | null; adopted_content_revision: number | null; created_at: Date;
};
async function substitutionRows(c: QueryClient, p: Principal, setId: string, id?: string) {
  return (await c.query<SubstitutionRecord & { proposer_name: string; decided_by_name: string | null; decision_owner_name: string | null; commercial_owner_name: string | null; commercial_decided_by_name: string | null; has_successor: boolean }>(
    `SELECT s.*,s.scope_quantity::text,s.decision_due::text,pr.display_name AS proposer_name,de.display_name AS decided_by_name,ow.display_name AS decision_owner_name,
      co.display_name AS commercial_owner_name,cd.display_name AS commercial_decided_by_name,
      EXISTS(SELECT 1 FROM ppo.material_substitutions n WHERE (n.workspace_id,n.predecessor_id)=(s.workspace_id,s.id)) AS has_successor
     FROM ppo.material_substitutions s JOIN ppo.users pr ON (pr.workspace_id,pr.id)=(s.workspace_id,s.proposer_id)
     LEFT JOIN ppo.users de ON (de.workspace_id,de.id)=(s.workspace_id,s.decided_by) LEFT JOIN ppo.users ow ON (ow.workspace_id,ow.id)=(s.workspace_id,s.decision_owner_id)
     LEFT JOIN ppo.users co ON (co.workspace_id,co.id)=(s.workspace_id,s.commercial_owner_id) LEFT JOIN ppo.users cd ON (cd.workspace_id,cd.id)=(s.workspace_id,s.commercial_decided_by)
     WHERE s.workspace_id=$1 AND s.set_id=$2 AND ($3::uuid IS NULL OR s.id=$3) ORDER BY s.created_at DESC,s.id DESC`, [p.workspace_id, setId, id ?? null])).rows;
}
function presentSubstitution(s: Awaited<ReturnType<typeof substitutionRows>>[number], line: LoadedLine | undefined, access: Access, actor: string) {
  const stale = !!line && s.state !== "Draft" && line.row.content_hash !== s.line_content_hash && !s.adopted_at,
    blockers = acceptanceBlockers(s.criteria),
    authority = line ? policyAllows(access.policy, actor, "TechnicalReviewer", [String(line.row.discipline)], line.row.purpose as ReleasePurpose) : "The line is unavailable.";
  return {
    id: s.id, version: s.version, line_id: s.line_id, line_number: line?.row.line_number ?? null, line_description: line ? String(line.row.description) : null,
    location: line ? String(line.row.location) : null, system_name: line ? String(line.row.system_name) : null,
    line_content_revision: s.line_content_revision, original_code: s.original_code, original_description: s.original_description,
    candidate_code: s.candidate_code, candidate_description: s.candidate_description, candidate_manufacturer: s.candidate_manufacturer,
    candidate_revision: s.candidate_revision, candidate_item_key: s.candidate_item_key, proposal_reason: s.reason,
    scope_quantity: formatQuantity(parseQuantity(s.scope_quantity)!), unit: line?.row.unit ?? null, criteria: s.criteria, impacts: s.impacts, state: s.state,
    proposer_id: s.proposer_id, proposer_name: s.proposer_name, submitted_hash: s.submitted_hash, submitted_at: s.submitted_at?.toISOString() ?? null,
    decided_by_name: s.decided_by_name, decided_at: s.decided_at?.toISOString() ?? null, decision_rationale: s.decision_rationale,
    decision_owner_name: s.decision_owner_name, decision_due: s.decision_due, policy_version: s.policy_version,
    commercial_state: s.commercial_state, commercial_note: s.commercial_note, commercial_owner_name: s.commercial_owner_name,
    commercial_decided_by_name: s.commercial_decided_by_name, commercial_decided_at: s.commercial_decided_at?.toISOString() ?? null,
    predecessor_id: s.predecessor_id, has_successor: s.has_successor, adopted_at: s.adopted_at?.toISOString() ?? null, adopted_content_revision: s.adopted_content_revision,
    // Reasons travel with the record, so a disabled positive decision always has its explanation beside it.
    stale, acceptance_blockers: [...blockers, ...(stale ? ["The line changed after this comparison was submitted. It needs a corrected successor and a fresh decision."] : [])],
    decision_refusal: !access.can.review ? "Technical review is a separate duty that this identity does not hold." : s.proposer_id === actor || line?.row.author_id === actor ? "You proposed this alternate or authored its line, so you cannot decide it." : authority,
  };
}

export async function readLine(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["line_id", "set"]), c = database(),
    f = await frame(c, p, packageId, setParam(q)),
    line = f.lines.find((l) => l.row.id === uuid(q.line_id, "line_id"));
  if (!line || !f.set) throw unavailable();
  const proposals = (await substitutionRows(c, p, f.set.id)).filter((s) => s.line_id === line.row.id),
    releases = (await c.query<{ id: string; release_number: number; review_state: string; issue_state: string; quantity: string; withdrawn_at: Date | null }>(
      `SELECT r.id,r.release_number,r.review_state,r.issue_state,rl.quantity::text,r.withdrawn_at FROM ppo.material_release_lines rl JOIN ppo.material_releases r ON (r.workspace_id,r.id)=(rl.workspace_id,rl.release_id)
       WHERE rl.workspace_id=$1 AND rl.line_id=$2 ORDER BY r.release_number DESC`, [p.workspace_id, line.row.id])).rows,
    handover = (await c.query<{ state: string; revision: number }>(
      `SELECT h.state,h.revision FROM ppo.material_handovers h JOIN ppo.material_release_lines rl ON (rl.workspace_id,rl.release_id)=(h.workspace_id,h.release_id)
       WHERE h.workspace_id=$1 AND rl.line_id=$2 ORDER BY h.created_at DESC LIMIT 1`, [p.workspace_id, line.row.id])).rows[0];
  const live = proposals.find((s) => !s.has_successor);
  return {
    ...f.shell, line: present(line), binding: binding(line), locked: line.locked,
    parent: line.row.parent_line_id ? f.lines.filter((l) => l.row.id === line.row.parent_line_id).map((l) => ({ id: l.row.id, line_number: l.row.line_number, description: String(l.row.description) }))[0] ?? null : null,
    children: f.live.filter((l) => l.row.parent_line_id === line.row.id).map((l) => ({ id: l.row.id, line_number: l.row.line_number, description: String(l.row.description), quantity: l.quantity, unit: l.row.unit })),
    group: line.row.dependency_group ? f.live.filter((l) => l.row.dependency_group === line.row.dependency_group && l.row.id !== line.row.id).map((l) => ({ id: l.row.id, line_number: l.row.line_number, description: String(l.row.description) })) : [],
    substitution: live ? presentSubstitution(live, line, f.access, p.actor_id) : null,
    // Two separate families, shown separately: what Engineering has decided, and what Supply Chain has received.
    technical_acceptance: !live ? (line.readiness.code === "TechnicallyReviewed" || line.readiness.code === "Released" ? line.readiness.label : "Not reviewed") : live.state === "Accepted" ? "Alternate accepted" : live.state === "Rejected" ? "Alternate rejected" : live.state === "Draft" ? "Alternate in draft" : live.state === "Submitted" ? "Pending review" : label(live.state),
    supply_handover: handover ? `${label(handover.state)} (revision ${handover.revision})` : "Not prepared",
    releases: releases.map((r) => ({ id: r.id, release_number: r.release_number, review_state: r.review_state, issue_state: r.issue_state, quantity: formatQuantity(parseQuantity(r.quantity)!), withdrawn: !!r.withdrawn_at })),
  };
}

export async function readMapping(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set"]), f = await frame(database(), p, packageId, setParam(q));
  const entity = (await database().query<{ erp_company_id: string; display_name: string }>("SELECT erp_company_id,display_name FROM ppo.companies WHERE workspace_id=$1 AND id=$2", [p.workspace_id, f.access.pkg.company_id])).rows[0];
  return {
    ...f.shell,
    // The only entity a binding may be verified against: a matching item code in another company proves nothing.
    target: { provider: "Synthetic", entity: entity.erp_company_id, company_name: entity.display_name, adapter: "Synthetic item adapter (no ERP connection exists)" },
    items: f.live.map((l) => ({ line: present(l), binding: binding(l), locked: l.locked })),
    counts: Object.fromEntries(mappingConditions.map((m) => [m, f.live.filter((l) => l.row.mapping === m).length])),
  };
}

export async function readSubstitutions(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set", "substitution_id"]), c = database(), f = await frame(c, p, packageId, setParam(q));
  const rows = f.set ? await substitutionRows(c, p, f.set.id) : [], byLine = new Map(f.lines.map((l) => [l.row.id, l]));
  const items = rows.map((s) => presentSubstitution(s, byLine.get(s.line_id), f.access, p.actor_id));
  const selected = q.substitution_id ? items.find((s) => s.id === uuid(q.substitution_id, "substitution_id")) : undefined;
  if (q.substitution_id && !selected) throw unavailable();
  return {
    ...f.shell, items, selected: selected ?? null,
    lines: f.live.filter((l) => !l.proposal?.open && !l.locked).map((l) => ({ id: l.row.id, line_number: l.row.line_number, description: String(l.row.description), model: l.row.model as string | null, product_ref: l.row.product_ref as string | null, quantity: l.quantity, unit: l.row.unit })),
    commercial_sources: f.sources.filter((s) => s.kind === "CommercialDecision" && s.use === "Current").map(sourceRef),
  };
}

// ---------------------------------------------------------------------------------------------
export type ReleaseRecord = {
  id: string; version: number; set_id: string; release_number: number; set_revision: number; purpose: ReleasePurpose; audience: string; manifest: Manifest; content_hash: string;
  review_state: ReviewState; issue_state: IssueState; prepared_by: string; submitted_at: Date | null; reviewed_by: string | null; reviewed_at: Date | null; review_rationale: string | null;
  review_due: string | null; policy_version: number | null; authorised_by: string | null; authorised_at: Date | null; issued_by: string | null; issued_at: Date | null;
  issue_operation_id: string | null; predecessor_id: string | null; superseded_by: string | null; withdrawn_at: Date | null; withdrawn_reason: string | null; created_at: Date;
};
type ReleaseRow = ReleaseRecord & { prepared_by_name?: string; reviewed_by_name?: string | null; authorised_by_name?: string | null; issued_by_name?: string | null; withdrawn_by_name?: string | null; review_owner_name?: string | null };
async function releaseRows(c: QueryClient, p: Principal, setId: string) {
  return (await c.query<ReleaseRow>(
    `SELECT r.*,r.review_due::text,pb.display_name AS prepared_by_name,rv.display_name AS reviewed_by_name,au.display_name AS authorised_by_name,
      iu.display_name AS issued_by_name,wd.display_name AS withdrawn_by_name,ro.display_name AS review_owner_name
     FROM ppo.material_releases r JOIN ppo.users pb ON (pb.workspace_id,pb.id)=(r.workspace_id,r.prepared_by)
     LEFT JOIN ppo.users rv ON (rv.workspace_id,rv.id)=(r.workspace_id,r.reviewed_by) LEFT JOIN ppo.users au ON (au.workspace_id,au.id)=(r.workspace_id,r.authorised_by)
     LEFT JOIN ppo.users iu ON (iu.workspace_id,iu.id)=(r.workspace_id,r.issued_by) LEFT JOIN ppo.users wd ON (wd.workspace_id,wd.id)=(r.workspace_id,r.withdrawn_by)
     LEFT JOIN ppo.users ro ON (ro.workspace_id,ro.id)=(r.workspace_id,r.review_owner_id)
     WHERE r.workspace_id=$1 AND r.set_id=$2 ORDER BY r.release_number DESC`, [p.workspace_id, setId])).rows;
}
export function presentRelease(r: ReleaseRow, lines: LoadedLine[], sources: LoadedSource[]) {
  const use = currentUse({ issue_state: r.issue_state, withdrawn: !!r.withdrawn_at, superseded: !!r.superseded_by }, r.manifest,
    new Map(lines.map((l) => [l.row.id, l.row.content_hash])), new Map(sources.map((s) => [s.id, s.use as SourceUse])));
  const iso = (d: Date | null) => d?.toISOString() ?? null;
  return {
    id: r.id, version: r.version, release_number: r.release_number, set_revision: r.set_revision, purpose: r.purpose, audience: r.audience,
    content_hash: r.content_hash, review_state: r.review_state, issue_state: r.issue_state, current_use: use.use, current_use_reasons: use.reasons,
    prepared_by: r.prepared_by, prepared_by_name: r.prepared_by_name ?? null, prepared_at: iso(r.created_at), submitted_at: iso(r.submitted_at),
    reviewed_by: r.reviewed_by, reviewed_by_name: r.reviewed_by_name ?? null, reviewed_at: iso(r.reviewed_at), review_rationale: r.review_rationale,
    review_owner_name: r.review_owner_name ?? null, review_due: r.review_due, policy_version: r.policy_version,
    authorised_by_name: r.authorised_by_name ?? null, authorised_at: iso(r.authorised_at), issued_by_name: r.issued_by_name ?? null, issued_at: iso(r.issued_at),
    issue_operation_id: r.issue_operation_id, predecessor_id: r.predecessor_id, superseded_by: r.superseded_by,
    withdrawn_at: iso(r.withdrawn_at), withdrawn_by_name: r.withdrawn_by_name ?? null, withdrawn_reason: r.withdrawn_reason, manifest: r.manifest,
    totals: demandTotals(r.manifest.lines),
  };
}
export async function replaced(c: QueryClient, p: Principal, predecessorId: string | null) {
  if (!predecessorId) return new Map<string, bigint>();
  return new Map((await c.query<{ line_id: string; quantity: string }>(
    `SELECT rl.line_id,rl.quantity::text FROM ppo.material_release_lines rl JOIN ppo.material_releases r ON (r.workspace_id,r.id)=(rl.workspace_id,rl.release_id)
     WHERE rl.workspace_id=$1 AND rl.release_id=$2 AND r.issue_state='Issued' AND r.withdrawn_at IS NULL AND r.superseded_by IS NULL`, [p.workspace_id, predecessorId])).rows.map((r) => [r.line_id, parseQuantity(r.quantity)!]));
}
// The one rule behind the preview, prepare, submit, review, authorise and issue: what stops this exact scope now.
export function liveBlockers(live: LoadedLine[], picked: { line_id: string; quantity: string; content_hash?: string; line_number?: string }[], purpose: ReleasePurpose, replaces: Map<string, bigint>): Blocker[] {
  const scope = live.map(scopeLine).map((l) => (replaces.has(l.id) ? { ...l, released_quantity: formatQuantity(parseQuantity(l.released_quantity)! - replaces.get(l.id)!) } : l));
  const found = releaseBlockers(scope, picked.map(({ line_id, quantity }) => ({ line_id, quantity })), purpose);
  for (const m of picked) {
    const now = live.find((l) => l.row.id === m.line_id);
    if (m.content_hash && now && now.row.content_hash !== m.content_hash) found.push({ line_id: m.line_id, code: "ContentChanged", message: `Line ${m.line_number} changed after this set was prepared. The frozen set cannot authorise the changed content; cancel it and prepare a successor.` });
  }
  return found;
}
export async function readReleases(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set", "release_id", "purpose", "selection"]), c = database(), f = await frame(c, p, packageId, setParam(q));
  const items = [];
  for (const row of f.set ? await releaseRows(c, p, f.set.id) : []) {
    const view = presentRelease(row, f.lines, f.sources), undecided = row.issue_state !== "Issued" && !["Cancelled", "Returned"].includes(row.review_state);
    items.push({ ...view, blockers: undecided ? liveBlockers(f.live, row.manifest.lines, row.purpose, await replaced(c, p, row.predecessor_id)) : [] });
  }
  const selected = q.release_id ? items.find((r) => r.id === uuid(q.release_id, "release_id")) : undefined;
  if (q.release_id && !selected) throw unavailable();
  // A preview runs the very rule the server applies on prepare, against the selection the URL carries.
  let preview = null;
  if (typeof q.selection === "string" && q.selection) {
    let chosen: unknown;
    try { chosen = JSON.parse(q.selection); } catch { invalid("selection", "The selection could not be read."); }
    const purpose = choice(q.purpose ?? "TechnicalReleaseForProcurement", "purpose", releasePurposes), picked = parseSelection(chosen);
    preview = { purpose, selection: picked, blockers: liveBlockers(f.live, picked, purpose, new Map()), exclusions: exclusions(f.live, picked) };
  }
  const role = (r: "TechnicalReviewer" | "ReleaseAuthority", purpose: ReleasePurpose, disciplinesIn: string[]) => policyAllows(f.access.policy, p.actor_id, r, disciplinesIn, purpose);
  return {
    ...f.shell, items, selected: selected ?? null, preview,
    lines: f.live.map((l) => ({ ...scopeLine(l), location: String(l.row.location), discipline: String(l.row.discipline), locked: l.locked, remaining: formatQuantity(parseQuantity(l.quantity)! - parseQuantity(l.released_quantity)!), next_owner_name: String(l.row.next_owner_name) })),
    authority: items.map((r) => {
      const d = [...new Set(r.manifest.lines.map((l) => l.discipline))], authors = new Set([r.prepared_by, ...r.manifest.lines.map((l) => l.author_id)]);
      return {
        release_id: r.id,
        review_refusal: !f.access.can.review ? "Technical review is a separate duty that this identity does not hold." : authors.has(p.actor_id) ? "You prepared this set or authored one of its lines, so you cannot review it." : role("TechnicalReviewer", r.purpose, d),
        release_refusal: !f.access.can.release ? "Material release authority is a separate duty that this identity does not hold." : authors.has(p.actor_id) ? "You prepared this set or authored one of its lines, so you cannot release it." : r.reviewed_by === p.actor_id && !f.access.policy?.allow_reviewer_release_overlap ? "The policy does not let the reviewer of a set also release it." : role("ReleaseAuthority", r.purpose, d),
      };
    }),
  };
}
// What a partial release leaves behind, with the reason and owner of each held remainder.
export function exclusions(live: LoadedLine[], picked: { line_id: string; quantity: string }[]) {
  const chosen = new Map(picked.map((s) => [s.line_id, parseQuantity(s.quantity) ?? 0n]));
  return live.filter((l) => l.row.kit_role !== "KitChild").flatMap((l) => {
    const remaining = parseQuantity(l.quantity)! - parseQuantity(l.released_quantity)! - (chosen.get(l.row.id) ?? 0n);
    return remaining > 0n ? [{ line_id: l.row.id, line_number: l.row.line_number, description: String(l.row.description), remaining_quantity: formatQuantity(remaining), unit: l.row.unit,
      reason: l.readiness.attention ? l.readiness.reasons[0] : chosen.has(l.row.id) ? "Only part of this requirement is in this release." : "Not selected for this release.", owner: String(l.row.next_owner_name) }] : [];
  });
}

export async function readHandovers(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set", "handover_id"]), c = database(), f = await frame(c, p, packageId, setParam(q));
  const releases = f.set ? (await releaseRows(c, p, f.set.id)).map((r) => presentRelease(r, f.lines, f.sources)) : [];
  const rows = f.set ? (await c.query<{
    id: string; version: number; revision: number; predecessor_id: string | null; release_id: string; requested_action: string; demand_basis: string; demand_source_id: string | null;
    receiver_id: string; required_by: string | null; required_by_timezone: string | null; payload: { lines: Manifest["lines"] } & Record<string, unknown>; payload_hash: string; state: HandoverState;
    created_at: Date; sent_at: Date | null; decided_at: Date | null; decision_reasons: { line_id: string | null; reason: string }[]; return_due: string | null; outcome_operation_id: string | null;
    receiver_name: string; coordinator_name: string; decided_by_name: string | null; return_owner_name: string | null }>(
    `SELECT h.*,h.required_by::text,h.return_due::text,rc.display_name AS receiver_name,co.display_name AS coordinator_name,de.display_name AS decided_by_name,ro.display_name AS return_owner_name
     FROM ppo.material_handovers h JOIN ppo.users rc ON (rc.workspace_id,rc.id)=(h.workspace_id,h.receiver_id) JOIN ppo.users co ON (co.workspace_id,co.id)=(h.workspace_id,h.coordinator_id)
     LEFT JOIN ppo.users de ON (de.workspace_id,de.id)=(h.workspace_id,h.decided_by) LEFT JOIN ppo.users ro ON (ro.workspace_id,ro.id)=(h.workspace_id,h.return_owner_id)
     WHERE h.workspace_id=$1 AND h.set_id=$2 ORDER BY h.created_at DESC,h.id DESC`, [p.workspace_id, f.set.id])).rows : [];
  const byId = new Map(rows.map((h) => [h.id, h])), releaseById = new Map(releases.map((r) => [r.id, r]));
  // Recipient details are for the people who prepare, release and receive; a limited viewer sees the state only.
  const detail = f.access.can.edit || f.access.can.release || f.access.can.receive || f.access.can.commercial;
  const items = rows.map((h) => {
    const release = releaseById.get(h.release_id), before = h.predecessor_id ? byId.get(h.predecessor_id) : undefined;
    return {
      id: h.id, version: h.version, revision: h.revision, predecessor_id: h.predecessor_id, release_id: h.release_id, release_number: release?.release_number ?? null,
      release_current_use: release?.current_use ?? null, release_current_use_reasons: release?.current_use_reasons ?? [], requested_action: h.requested_action,
      demand_basis: h.demand_basis, demand_source: sourceRef(f.sources.find((s) => s.id === h.demand_source_id)), required_by: h.required_by, required_by_timezone: h.required_by_timezone,
      receiver_id: detail ? h.receiver_id : null, receiver_name: detail ? h.receiver_name : "Withheld for this identity", coordinator_name: h.coordinator_name,
      payload: detail ? h.payload : null, payload_hash: h.payload_hash, state: h.state, prepared_at: h.created_at.toISOString(), sent_at: h.sent_at?.toISOString() ?? null,
      decided_by_name: h.decided_by_name, decided_at: h.decided_at?.toISOString() ?? null, decision_reasons: h.decision_reasons, return_owner_name: h.return_owner_name,
      return_due: h.return_due, outcome_operation_id: h.outcome_operation_id,
      differences: before ? manifestDifferences(before.payload.lines, h.payload.lines) : null,
      decision_refusal: !f.access.can.receive ? "Receiving decisions belong to Supply Chain, a duty this identity does not hold." : h.receiver_id !== p.actor_id ? `This payload is addressed to ${h.receiver_name}.` : policyAllows(f.access.policy, p.actor_id, "SupplyReceiver", [], release?.purpose ?? "TechnicalReleaseForProcurement"),
    };
  });
  const selected = q.handover_id ? items.find((h) => h.id === uuid(q.handover_id, "handover_id")) : undefined;
  if (q.handover_id && !selected) throw unavailable();
  return {
    ...f.shell, items, selected: selected ?? null,
    releases: releases.filter((r) => r.issue_state === "Issued").map(({ manifest, ...r }) => ({ ...r, line_count: manifest.lines.length })),
    demand_sources: f.sources.filter((s) => s.kind === "DemandAuthority" && s.use === "Current").map(sourceRef),
    // An Opportunity is presales context. Winning a deal, or a Project label on screen, is never fabricated to pass this gate.
    procurement_context: f.access.pkg.context_kind === "Project" ? null : "This package belongs to an Opportunity. Procurement-ready receiving is demonstrated for an awarded Project only.",
    site_timezone: f.access.site_timezone,
  };
}

export async function readHistory(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set", "subject", "subject_id", "limit"]), c = database(), f = await frame(c, p, packageId, setParam(q)),
    subject = q.subject ? choice(q.subject, "subject", ["MaterialSet", "MaterialSource", "MaterialLine", "MaterialSubstitution", "MaterialRelease", "MaterialHandover", "MaterialImpact"] as const) : null,
    subjectId = optionalId(q.subject_id || undefined, "subject_id"), limit = Number(q.limit ?? 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 300) invalid("limit", "Show 1 to 300 events.");
  const events = (await c.query<{ id: string; subject_type: string; subject_id: string; subject_version: number; event_type: string; reason: string; note: string | null; created_at: Date; actor_name: string; operation_id: string; snapshot: Record<string, unknown> }>(
    `SELECT e.id,e.subject_type,e.subject_id,e.subject_version,e.event_type,e.reason,e.note,e.created_at,e.operation_id,e.snapshot,u.display_name AS actor_name
     FROM ppo.material_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by)
     WHERE e.workspace_id=$1 AND e.package_id=$2 AND (e.set_id IS NULL OR $3::uuid IS NULL OR e.set_id=$3) AND ($4::text IS NULL OR e.subject_type=$4) AND ($5::uuid IS NULL OR e.subject_id=$5)
     ORDER BY e.created_at DESC,e.id DESC LIMIT $6`, [p.workspace_id, f.access.pkg.id, f.set?.id ?? null, subject, subjectId, limit + 1])).rows;
  const impacts = f.set ? (await c.query<{ id: string; version: number; source_id: string | null; release_id: string | null; change: string; affected: Record<string, unknown>; owner_id: string; owner_name: string; required_action: string; state: string; resolution: string | null; resolved_by_name: string | null; created_at: Date; resolved_at: Date | null }>(
    `SELECT i.*,ow.display_name AS owner_name,rs.display_name AS resolved_by_name FROM ppo.material_impacts i JOIN ppo.users ow ON (ow.workspace_id,ow.id)=(i.workspace_id,i.owner_id)
     LEFT JOIN ppo.users rs ON (rs.workspace_id,rs.id)=(i.workspace_id,i.resolved_by) WHERE i.workspace_id=$1 AND i.set_id=$2 ORDER BY i.created_at DESC`, [p.workspace_id, f.set.id])).rows : [];
  const names = new Map<string, string>([
    ...f.lines.map((l) => [l.row.id, `Line ${l.row.line_number} · ${l.row.description}`] as [string, string]),
    ...f.sources.map((s) => [s.id, `${s.reference} revision ${s.revision}`] as [string, string]),
  ]);
  return {
    ...f.shell,
    events: events.slice(0, limit).map(({ snapshot, created_at, ...e }) => ({
      ...e, created_at: created_at.toISOString(),
      subject_name: names.get(e.subject_id) ?? (snapshot.release_number ? `Release ${snapshot.release_number}` : snapshot.candidate_code ? `Alternate ${snapshot.candidate_code}` : snapshot.revision && e.subject_type === "MaterialHandover" ? `Handover revision ${snapshot.revision}` : label(e.subject_type.replace("Material", ""))),
      content_revision: (snapshot.content_revision as number | undefined) ?? null,
    })),
    has_more: events.length > limit,
    impacts: impacts.map((i) => ({ id: i.id, version: i.version, source: sourceRef(f.sources.find((s) => s.id === i.source_id)), release_id: i.release_id, change: i.change, affected: i.affected, owner_id: i.owner_id, owner_name: i.owner_name,
      required_action: i.required_action, state: i.state, resolution: i.resolution, resolved_by_name: i.resolved_by_name, created_at: i.created_at.toISOString(), resolved_at: i.resolved_at?.toISOString() ?? null })),
    sources: f.sources.map((s) => ({ ...sourceRef(s)!, change_reason: s.change_reason, changed_at: s.changed_at })),
  };
}

export async function readSources(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set", "source_id"]), f = await frame(database(), p, packageId, setParam(q));
  const selected = q.source_id ? f.sources.find((s) => s.id === uuid(q.source_id, "source_id")) : undefined;
  if (q.source_id && !selected) throw unavailable();
  const usedBy = (id: string) => f.live.filter((l) => l.row.drawing_source_id === id || l.row.basis_source_id === id).map((l) => l.row.line_number);
  return {
    ...f.shell,
    items: f.sources.map((s) => ({ ...sourceRef(s)!, change_reason: s.change_reason, changed_at: s.changed_at, used_by: usedBy(s.id) })),
    selected: selected ? { ...sourceRef(selected)!, content: selected.content, content_withheld: selected.content_withheld, change_reason: selected.change_reason, changed_at: selected.changed_at, used_by: usedBy(selected.id) } : null,
  };
}

// Packages the actor may read, with whatever material sets they hold. The picker never names a fixture.
export async function readEntry(p: Principal, query: unknown) {
  const q = object(query, ["q"]), page = await listEngineering(p, { q: q.q ?? "", limit: "100" });
  const found = page.items.length ? (await database().query<{ package_id: string; id: string; code: string; revision: number; lines: number }>(
    `SELECT s.package_id,s.id,s.set_code AS code,s.revision,(SELECT count(*)::int FROM ppo.material_lines l WHERE (l.workspace_id,l.set_id)=(s.workspace_id,s.id) AND l.removed_at IS NULL) AS lines
     FROM ppo.material_sets s WHERE s.workspace_id=$1 AND s.package_id=ANY($2::uuid[]) ORDER BY s.set_code`, [p.workspace_id, page.items.map((i) => i.id)])).rows : [];
  return {
    items: page.items.map((i) => ({ id: i.id, reference: i.display_number, title: i.title, discipline: i.discipline, context_kind: i.context_kind, context_title: i.context_title,
      context_reference: i.context_reference, customer_name: i.customer_name, sets: found.filter((s) => s.package_id === i.id).map(({ id, code, revision, lines }) => ({ id, code, revision, lines })) })),
    has_more: !!page.next_cursor, observed_at: page.observed_at,
  };
}

// Exports follow the reader's projection, keep units and source time, neutralise formula-leading text and never total unlike units.
export async function exportCsv(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["set", "kind", "release_id"]), kind = choice(q.kind ?? "register", "kind", ["register", "release"] as const), c = database(),
    f = await frame(c, p, packageId, setParam(q));
  if (!f.set) throw unavailable();
  const head = [["Powerplants One synthetic export", "Not an order, approval or authority to spend"], ["Package", f.access.pkg.display_number, f.access.pkg.title], ["Material set", `${f.set.code} r${String(f.set.revision).padStart(2, "0")}`], ["Observed", f.shell.observed_at], []];
  if (kind === "release") {
    const release = (await releaseRows(c, p, f.set.id)).map((r) => presentRelease(r, f.lines, f.sources)).find((r) => r.id === uuid(q.release_id, "release_id"));
    if (!release) throw unavailable();
    return { name: `${f.access.pkg.display_number}-release-${release.release_number}.csv`, body: csv([...head, ["Release", release.release_number, label(release.purpose), label(release.issue_state), `Current use: ${label(release.current_use)}`], ["Content hash", release.content_hash], [],
      ["Line", "Material requirement", "Released quantity", "Unit", "Content revision", "Item", "Procurement quantity", "Procurement unit", "Drawing sources"],
      ...release.manifest.lines.map((l) => [l.line_number, l.description, l.quantity, l.unit, l.content_revision, l.mapping.item_key, l.procurement?.quantity ?? "Unresolved", l.procurement?.unit ?? "", release.manifest.sources.filter((s) => l.source_ids.includes(s.id)).map((s) => `${s.reference} ${s.revision}`).join("; ")]),
      [], ["Totals by unit (kit contents excluded)"], ...release.totals.map((t) => [t.quantity, t.unit])]) };
  }
  return { name: `${f.access.pkg.display_number}-materials-${f.set.code}.csv`, body: csv([...head,
    ["Line", "Material requirement", "Location", "Areas served", "Design quantity", "Unit", "Drawing", "Revision", "Item mapping", "Line readiness", "Next action owner", "Material required by"],
    ...f.live.map(present).map((l) => [l.line_number, l.description, l.location, l.served_areas.join("; "), l.quantity, l.unit, l.drawing?.reference ?? "", l.drawing?.revision ?? "", label(l.mapping), l.readiness.label, l.next_owner_name, l.required_by ?? "Date needed"]),
    [], ["Totals by unit (kit contents excluded)"], ...demandTotals(f.live.map(scopeLine)).map((t) => [quantityText(t.quantity, t.unit)])]) };
}
