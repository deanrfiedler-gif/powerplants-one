import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import type { QueryClient } from "../../platform/permissions";
import {
  currentVersion, eligiblePerson, lineContentHash, lineConversion, loadLines, loadSources, materialsAccess, record, refuse, requireDuty, setRow, sha256,
  type Access, type Duty, type LineRecord, type LoadedLine, type LoadedSource,
} from "./context";
import { exclusions, liveBlockers, presentRelease, replaced, type ReleaseRecord, type SubstitutionRecord } from "./reads";
import { parseHandoverCommand, parseImpactCommand, parseLineCommand, parseReleaseCommand, parseSetCommand, parseSourceCommand, parseSubstitutionCommand } from "./validation";
import {
  acceptanceBlockers, formatQuantity, parseQuantity, policyAllows, quantityText,
  type Blocker, type Manifest, type ManifestLine,
} from "./model";

type Saved = { id: string; version: number; state: string; updated_at: Date; audit_details?: Record<string, unknown> };
const blocked = (code: string, blockers: (Blocker | string)[]) =>
  new AppError(422, code, blockers.slice(0, 6).map((b) => (typeof b === "string" ? b : b.message)).join(" "), blockers.slice(0, 20).map((b) => ({ field: typeof b === "string" || !b.line_id ? "selection" : `line-${b.line_id}`, message: typeof b === "string" ? b : b.message })));
const authority = (message: string | null) => { if (message) throw new AppError(403, message.startsWith("Authority not configured") ? "AuthorityNotConfigured" : "Forbidden", message); };
async function one<T extends Record<string, unknown>>(c: QueryClient, sql: string, values: unknown[]): Promise<T> {
  const row = (await c.query<T>(sql, values)).rows[0];
  if (!row) throw unavailable();
  return row;
}
// Everyone who ever created or changed the technical content of these lines. None of them may review or release it.
async function contributors(c: QueryClient, p: Principal, lineIds: string[]) {
  return new Set((await c.query<{ created_by: string }>(
    "SELECT DISTINCT created_by FROM ppo.material_events WHERE workspace_id=$1 AND subject_id=ANY($2::uuid[]) AND event_type IN ('LineCreated','LineContentRevised','BindingSaved','CandidateAdopted')",
    [p.workspace_id, lineIds])).rows.map((r) => r.created_by));
}
async function packageSource(sources: LoadedSource[], id: string | null, field: string, kinds: string[]) {
  if (!id) return null;
  const source = sources.find((s) => s.id === id);
  if (!source || !kinds.includes(source.kind)) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field, message: `Choose a ${kinds.join(" or ")} source retained for this package.` }]);
  return source;
}

// ---------------------------------------------------------------------------------------------
export async function setCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseSetCommand(value);
  return sharedOperation<Access>(p, command, `MaterialSet:${command.action}`, async (c) => {
    const access = await materialsAccess(c, p, packageId);
    requireDuty(access, "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    if (command.action === "create") {
      const row = await one<Saved>(c, `INSERT INTO ppo.material_sets(id,workspace_id,company_id,package_id,created_by,updated_by,set_code,revision,title,owner_id)
        VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$5) RETURNING id,version,'Draft'::text AS state,updated_at`,
        [command.id, p.workspace_id, access.pkg.company_id, access.pkg.id, p.actor_id, command.set_code, command.revision, command.title]);
      await record(c, p, access, command, { set_id: row.id, subject_type: "MaterialSet", subject_id: row.id, event_type: "SetCreated" });
      return row;
    }
    const set = await setRow(c, p, access, command.set_id, true);
    currentVersion(set.version, command.expected_version);
    const row = await one<Saved>(c, "UPDATE ppo.material_sets SET version=version+1,revision=revision+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2 RETURNING id,version,'Draft'::text AS state,updated_at", [p.workspace_id, set.id, p.actor_id]);
    await record(c, p, access, command, { set_id: set.id, subject_type: "MaterialSet", subject_id: set.id, event_type: "SetRevised" });
    return row;
  }, "MaterialSet", "MaterialRecordSaved");
}

// A changed or withdrawn source never rewrites what relied on it. It raises one owned follow-up per
// affected set, naming the lines, releases and receiving outcomes that someone must now look at.
async function raiseImpact(c: PoolClient, p: Principal, access: Access, command: { operation_id: string; reason: string }, cause: { source_id: string } | { release_id: string }, change: "Superseded" | "Withdrawn", successor: string | null) {
  const sourceId = "source_id" in cause ? cause.source_id : null, releaseId = "release_id" in cause ? cause.release_id : null;
  const found = (await c.query<{ set_id: string; owner_id: string; lines: string[]; releases: { id: string; number: number; state: string }[]; handovers: { revision: number; state: string }[] }>(
    `SELECT s.id AS set_id,s.owner_id,
      coalesce((SELECT array_agg(l.line_number ORDER BY l.line_number) FROM ppo.material_lines l WHERE (l.workspace_id,l.set_id)=(s.workspace_id,s.id) AND l.removed_at IS NULL
        AND (($3::uuid IS NOT NULL AND $3 IN (l.drawing_source_id,l.basis_source_id)) OR ($4::uuid IS NOT NULL AND EXISTS(SELECT 1 FROM ppo.material_release_lines rl WHERE (rl.workspace_id,rl.release_id,rl.line_id)=(l.workspace_id,$4,l.id))))),'{}') AS lines,
      coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'number',r.release_number,'state',r.issue_state) ORDER BY r.release_number) FROM ppo.material_releases r WHERE (r.workspace_id,r.set_id)=(s.workspace_id,s.id) AND r.review_state<>'Cancelled'
        AND (r.id=$4 OR ($3::uuid IS NOT NULL AND r.manifest->'sources' @> jsonb_build_array(jsonb_build_object('id',$3::text))))),'[]') AS releases,
      coalesce((SELECT jsonb_agg(jsonb_build_object('revision',h.revision,'state',h.state) ORDER BY h.created_at) FROM ppo.material_handovers h JOIN ppo.material_releases r ON (r.workspace_id,r.id)=(h.workspace_id,h.release_id)
        WHERE (h.workspace_id,h.set_id)=(s.workspace_id,s.id) AND (r.id=$4 OR ($3::uuid IS NOT NULL AND r.manifest->'sources' @> jsonb_build_array(jsonb_build_object('id',$3::text))))),'[]') AS handovers
     FROM ppo.material_sets s WHERE s.workspace_id=$1 AND s.package_id=$2`, [p.workspace_id, access.pkg.id, sourceId, releaseId])).rows;
  for (const f of found) {
    if (!f.lines.length && !f.releases.length) continue;
    const accepted = f.handovers.filter((h) => h.state === "Accepted").length;
    const id = randomUUID(), inserted = await c.query(
      `INSERT INTO ppo.material_impacts(id,workspace_id,company_id,set_id,created_by,updated_by,source_id,release_id,change,affected,owner_id,required_action)
       VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
      [id, p.workspace_id, access.pkg.company_id, f.set_id, p.actor_id, sourceId, releaseId, change, { lines: f.lines, releases: f.releases, handovers: f.handovers, successor_source_id: successor }, f.owner_id,
        `${sourceId ? `Reassess line ${f.lines.join(", ") || "scope"} against the ${successor ? "new source revision" : "withdrawn source"}; earlier reviews and releases cannot authorise new use.` : "Current use of this release was withdrawn; confirm what already relied on it."}${accepted ? ` ${accepted} accepted receiving outcome${accepted > 1 ? "s are" : " is"} retained as history: agree the follow-up with Supply Chain and the change owner (EN-07). Nothing has been recalled, cancelled or reversed.` : ""}`]);
    if (inserted.rowCount) await record(c, p, access, command, { set_id: f.set_id, subject_type: "MaterialImpact", subject_id: id, event_type: "ImpactRaised" });
  }
}

export async function sourceCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseSourceCommand(value);
  return sharedOperation<Access>(p, command, `MaterialSource:${command.action}`, async (c) => {
    const access = await materialsAccess(c, p, packageId);
    requireDuty(access, "source");
    return access;
  }, async (c, access): Promise<Saved> => {
    const sources = await loadSources(c, p, access);
    if (command.action === "withdraw") {
      const source = sources.find((s) => s.id === command.source_id);
      if (!source) throw unavailable();
      if (source.use === "Superseded" || source.use === "Withdrawn") throw refuse("SourceAlreadyChanged", `This source is already ${source.use.toLowerCase()}.`, 409);
      await c.query("INSERT INTO ppo.material_source_changes(workspace_id,company_id,source_id,change,reason,operation_id,created_by) VALUES($1,$2,$3,'Withdrawn',$4,$5,$6)", [p.workspace_id, access.pkg.company_id, source.id, command.reason, command.operation_id, p.actor_id]);
      await record(c, p, access, command, { set_id: null, subject_type: "MaterialSource", subject_id: source.id, event_type: "SourceWithdrawn" });
      await raiseImpact(c, p, access, command, { source_id: source.id }, "Withdrawn", null);
      return { id: source.id, version: 1, state: "Withdrawn", updated_at: new Date() };
    }
    const before = command.supersedes_id ? sources.find((s) => s.id === command.supersedes_id) : undefined;
    if (command.supersedes_id && (!before || before.kind !== command.kind || before.reference !== command.reference))
      throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "supersedes_id", message: "A new revision supersedes an earlier snapshot of the same document." }]);
    if (before && before.use !== "Current" && before.use !== "Unavailable") throw refuse("SourceAlreadyChanged", `${before.reference} revision ${before.revision} is already ${before.use.toLowerCase()}.`, 409);
    // The bytes are retained and hashed here. A hash offered by a client is never accepted as identity.
    const row = await one<Saved>(c, `INSERT INTO ppo.material_sources(id,workspace_id,company_id,package_id,created_by,kind,reference,title,revision,file_version,permitted_purpose,completeness,content,content_hash,restricted,observed_at,predecessor_id,adapter)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,clock_timestamp(),$16,'SyntheticUpstreamFixture') RETURNING id,version,'Observed'::text AS state,created_at AS updated_at`,
      [command.id, p.workspace_id, access.pkg.company_id, access.pkg.id, p.actor_id, command.kind, command.reference, command.title, command.revision, command.file_version, command.permitted_purpose,
        command.content === null ? "Unavailable" : "Complete", command.content, command.content === null ? null : sha256(command.content), command.restricted, before?.id ?? null]);
    await record(c, p, access, command, { set_id: null, subject_type: "MaterialSource", subject_id: row.id, event_type: "SourceObserved" });
    if (before) {
      await c.query("INSERT INTO ppo.material_source_changes(workspace_id,company_id,source_id,change,successor_id,reason,operation_id,created_by) VALUES($1,$2,$3,'Superseded',$4,$5,$6,$7)", [p.workspace_id, access.pkg.company_id, before.id, row.id, command.reason, command.operation_id, p.actor_id]);
      await raiseImpact(c, p, access, command, { source_id: before.id }, "Superseded", row.id);
    }
    return row;
  }, "MaterialSource", "MaterialSourceObserved");
}

// ---------------------------------------------------------------------------------------------
const lineColumns = ["line_number", "description", "category", "specification", "discipline", "system_name", "location", "served_areas", "quantity", "unit", "quantity_basis", "required_by", "purpose",
  "manufacturer", "model", "supplier_part", "product_ref", "kit_role", "parent_line_id", "dependency_group", "drawing_source_id", "basis_source_id", "scope_decision_needed", "scope_decision_owner_id",
  "next_owner_id", "next_action", "action_due"] as const;
const bindingColumns = ["mapping", "mapping_provider", "mapping_configuration", "mapping_entity", "mapping_item_key", "mapping_item_description", "mapping_candidates", "mapping_rationale", "mapping_owner_id",
  "target_unit", "conversion_numerator", "conversion_denominator", "whole_units_only", "target_precision", "conversion_evidence", "overage_basis"] as const;
const json = (key: string, v: unknown) => (key === "served_areas" || key === "mapping_candidates" ? JSON.stringify(v) : v);
async function lockedLine(c: PoolClient, p: Principal, access: Access, lineId: string) {
  const row = (await c.query<LineRecord>(
    "SELECT l.*,l.required_by::text,l.action_due::text FROM ppo.material_lines l JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(l.workspace_id,l.set_id) WHERE l.workspace_id=$1 AND s.package_id=$2 AND l.id=$3 FOR UPDATE OF l", [p.workspace_id, access.pkg.id, lineId])).rows[0];
  if (!row) throw unavailable();
  const loaded = (await loadLines(c, p, row.set_id, await loadSources(c, p, access))).find((l) => l.row.id === lineId)!;
  return { row, loaded };
}
function editable(loaded: LoadedLine) {
  if (loaded.row.removed_at) throw refuse("LineRemoved", "This line was removed from the draft. Its history is retained; add a new line instead.", 409);
  if (loaded.locked) throw refuse("LineLocked", "This line is inside a release set that is under review or authorised. Its content cannot move underneath that decision: return or cancel the set first, then correct the line.", 409);
}
async function updateLine(c: PoolClient, p: Principal, row: LineRecord, merged: LineRecord, columns: readonly (keyof LineRecord)[], extra: Partial<LineRecord> = {}) {
  const content_hash = lineContentHash(merged), changed = content_hash !== row.content_hash,
    values: Record<string, unknown> = { ...Object.fromEntries(columns.map((k) => [k, json(k, merged[k])])), ...extra, content_hash, content_revision: row.content_revision + (changed ? 1 : 0) }, keys = Object.keys(values);
  const saved = await one<Saved>(c, `UPDATE ppo.material_lines SET version=version+1,updated_at=clock_timestamp(),updated_by=$2,${keys.map((k, i) => `${k}=$${i + 4}`).join(",")} WHERE workspace_id=$1 AND id=$3 RETURNING id,version,mapping AS state,updated_at`,
    [p.workspace_id, p.actor_id, row.id, ...keys.map((k) => values[k])]);
  return { saved, changed };
}
export async function lineCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseLineCommand(value);
  return sharedOperation<Access>(p, command, `MaterialLine:${command.action}`, async (c) => {
    const access = await materialsAccess(c, p, packageId);
    // Verifying an item for the target entity is the item owner's act, reached through the synthetic adapter; everything else is authoring.
    if (command.action === "binding" && command.mapping === "Verified") requireDuty(access, "source");
    else requireDuty(access, "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    if (command.action === "remove") {
      const { row, loaded } = await lockedLine(c, p, access, command.line_id);
      currentVersion(row.version, command.expected_version);
      editable(loaded);
      if (parseQuantity(loaded.released_quantity)! > 0n) throw refuse("LineReleased", "Part of this line is in an issued release. Withdraw or supersede that release; an issued requirement is not removed.", 409);
      if (loaded.proposal?.open) throw refuse("SubstitutionOpen", "A proposed alternate is still open on this line. Decide it first.", 409);
      const saved = await one<Saved>(c, "UPDATE ppo.material_lines SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,removed_at=clock_timestamp(),removed_reason=$4 WHERE workspace_id=$1 AND id=$2 RETURNING id,version,'Removed'::text AS state,updated_at", [p.workspace_id, row.id, p.actor_id, command.removed_reason]);
      await record(c, p, access, command, { set_id: row.set_id, subject_type: "MaterialLine", subject_id: row.id, event_type: "LineRemoved", note: command.removed_reason });
      return saved;
    }
    if (command.action === "binding") {
      const { row, loaded } = await lockedLine(c, p, access, command.line_id);
      currentVersion(row.version, command.expected_version);
      editable(loaded);
      const { operation_id: _o, schema_version: _s, reason: _r, action: _a, line_id: _l, expected_version: _v, ...fields } = command;
      void [_o, _s, _r, _a, _l, _v];
      const bound = ["Verified", "Proposed", "Changed"].includes(command.mapping),
        merged: LineRecord = { ...row, ...fields, mapping_provider: command.mapping_item_key ? "Synthetic" : null };
      const missing = (["mapping_configuration", "mapping_entity", "mapping_item_key", "target_unit"] as const).filter((k) => !command[k]);
      if (bound && missing.length) throw new AppError(422, "InvalidData", "Check the highlighted details.", missing.map((field) => ({ field, message: "An identified binding names its configuration, entity, item key and target unit." })));
      if (command.mapping === "Ambiguous" && command.mapping_candidates.length < 2) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "mapping_candidates", message: "Ambiguous means at least two permissible candidates; list them with what tells them apart. The first match is never chosen for you." }]);
      if (command.mapping === "NotRequired" && (row.purpose !== "InformationOnly" || !command.mapping_rationale)) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "mapping", message: "“Not required” is only for a named non-procurement output, with its rationale. It can never satisfy procurement readiness." }]);
      if (command.mapping_owner_id) await eligiblePerson(c, p, access, command.mapping_owner_id, "mapping_owner_id");
      if (command.mapping === "Verified") {
        const entity = await one<{ erp_company_id: string }>(c, "SELECT erp_company_id FROM ppo.companies WHERE workspace_id=$1 AND id=$2", [p.workspace_id, access.pkg.company_id]);
        // The same item code in another company is another item.
        if (command.mapping_entity !== entity.erp_company_id) throw new AppError(422, "EntityMismatch", `This item belongs to entity ${command.mapping_entity}; this package's company is ${entity.erp_company_id}. A mapping is never reused across companies because the code matches.`, [{ field: "mapping_entity", message: `Verify the item for ${entity.erp_company_id}.` }]);
        const conversion = lineConversion(merged);
        if (!conversion?.ok) throw new AppError(422, conversion?.code ?? "ConversionMissing", conversion?.message ?? "Name the target unit before verifying.", [{ field: "conversion_numerator", message: conversion?.message ?? "A target unit is required." }]);
      }
      const { saved, changed } = await updateLine(c, p, row, merged, bindingColumns, {
        mapping_version: row.mapping_version + 1, mapping_observed_at: new Date(), mapping_verified_by: command.mapping === "Verified" ? p.actor_id : null });
      await record(c, p, access, command, { set_id: row.set_id, subject_type: "MaterialLine", subject_id: row.id, event_type: changed ? "BindingSaved" : "BindingObserved" });
      return saved;
    }
    const set = await setRow(c, p, access, command.set_id), sources = await loadSources(c, p, access);
    await packageSource(sources, command.drawing_source_id, "drawing_source_id", ["DrawingIssue"]);
    await packageSource(sources, command.basis_source_id, "basis_source_id", ["DesignBasis"]);
    await eligiblePerson(c, p, access, command.next_owner_id, "next_owner_id");
    if (command.scope_decision_owner_id) await eligiblePerson(c, p, access, command.scope_decision_owner_id, "scope_decision_owner_id", "project.edit");
    if (command.parent_line_id) {
      const parent = (await c.query("SELECT 1 FROM ppo.material_lines WHERE workspace_id=$1 AND set_id=$2 AND id=$3 AND kit_role='KitParent' AND removed_at IS NULL", [p.workspace_id, set.id, command.parent_line_id])).rowCount;
      if (!parent) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "parent_line_id", message: "Choose a kit line of this material set." }]);
    }
    const { operation_id: _o, schema_version: _s, reason: _r, action: _a, line_id, expected_version, set_id: _set, ...fields } = command;
    void [_o, _s, _r, _a, _set];
    if (expected_version === null) {
      const merged = { ...fields, mapping: "Missing" as const, mapping_candidates: [], whole_units_only: false, target_precision: 6 };
      const saved = await one<Saved>(c, `INSERT INTO ppo.material_lines(id,workspace_id,company_id,set_id,created_by,updated_by,author_id,content_hash,${lineColumns.join(",")})
        VALUES($1,$2,$3,$4,$5,$5,$5,$6,${lineColumns.map((_, i) => `$${i + 7}`).join(",")}) RETURNING id,version,mapping AS state,updated_at`,
        [line_id, p.workspace_id, access.pkg.company_id, set.id, p.actor_id, lineContentHash(merged), ...lineColumns.map((k) => json(k, fields[k]))]);
      await record(c, p, access, command, { set_id: set.id, subject_type: "MaterialLine", subject_id: line_id, event_type: "LineCreated" });
      return saved;
    }
    const { row, loaded } = await lockedLine(c, p, access, line_id);
    currentVersion(row.version, expected_version);
    if (row.set_id !== set.id) throw unavailable();
    const merged: LineRecord = { ...row, ...fields };
    // Coordination may move while a set is under review; technical content may not.
    if (lineContentHash(merged) !== row.content_hash) editable(loaded);
    else if (loaded.row.removed_at) editable(loaded);
    if (parseQuantity(command.quantity)! < parseQuantity(loaded.released_quantity)!)
      throw new AppError(422, "BelowReleased", `${quantityText(loaded.released_quantity, command.unit)} of this line is already in an issued release. The requirement cannot fall below it; withdraw or supersede that release first.`, [{ field: "quantity", message: "Below the actively released quantity." }]);
    const { saved, changed } = await updateLine(c, p, row, merged, lineColumns);
    await record(c, p, access, command, { set_id: set.id, subject_type: "MaterialLine", subject_id: row.id, event_type: changed ? "LineContentRevised" : "LineCoordinated" });
    return saved;
  }, "MaterialLine", "MaterialRecordSaved");
}

// ---------------------------------------------------------------------------------------------
type SubstitutionRow = SubstitutionRecord;
const substitutionDuty: Record<string, Duty> = { decide: "review", commercial: "commercial" };
export async function substitutionCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseSubstitutionCommand(value);
  return sharedOperation<Access>(p, command, `MaterialSubstitution:${command.action}`, async (c) => {
    const access = await materialsAccess(c, p, packageId);
    requireDuty(access, substitutionDuty[command.action] ?? "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    const load = async (id: string, expected: number) => {
      const s = (await c.query<SubstitutionRow>("SELECT s.*,s.scope_quantity::text FROM ppo.material_substitutions s JOIN ppo.material_sets m ON (m.workspace_id,m.id)=(s.workspace_id,s.set_id) WHERE s.workspace_id=$1 AND m.package_id=$2 AND s.id=$3 FOR UPDATE OF s", [p.workspace_id, access.pkg.id, id])).rows[0];
      if (!s) throw unavailable();
      currentVersion(s.version, expected);
      return { s, line: await lockedLine(c, p, access, s.line_id) };
    };
    const finish = async (id: string, setId: string, event: string, note: string | null = null) => {
      const saved = await one<Saved>(c, "SELECT id,version,state,updated_at FROM ppo.material_substitutions WHERE workspace_id=$1 AND id=$2", [p.workspace_id, id]);
      await record(c, p, access, command, { set_id: setId, subject_type: "MaterialSubstitution", subject_id: id, event_type: event, note });
      return saved;
    };
    const frozen = (s: SubstitutionRow, lineHash: string) => sha256({ line: lineHash, code: s.candidate_code, description: s.candidate_description, manufacturer: s.candidate_manufacturer, revision: s.candidate_revision, item: s.candidate_item_key ?? null, quantity: formatQuantity(parseQuantity(s.scope_quantity)!), criteria: s.criteria, impacts: s.impacts });

    if (command.action === "propose" || command.action === "update") {
      const existing = command.action === "update" ? await load(command.substitution_id, command.expected_version) : null,
        line = existing?.line ?? (await lockedLine(c, p, access, command.action === "propose" ? command.line_id : "")),
        newId = command.action === "propose" ? command.id : "";
      editable(line.loaded);
      if (existing && existing.s.state !== "Draft") throw refuse("SubstitutionFrozen", "A submitted comparison is frozen. Correct it through a successor after it is returned.", 409);
      if (!existing && line.loaded.proposal?.open) throw refuse("SubstitutionOpen", "This line already has an open proposal. Decide it before proposing another alternate.", 409);
      if (parseQuantity(command.scope_quantity)! > parseQuantity(line.loaded.quantity)!) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "scope_quantity", message: `The line requires ${quantityText(line.loaded.quantity, line.loaded.row.unit)}; an alternate cannot cover more.` }]);
      if (command.commercial_state === "DecisionNeeded") {
        if (!command.commercial_owner_id) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "commercial_owner_id", message: "Name the commercial coordinator who owns the decision." }]);
        await eligiblePerson(c, p, access, command.commercial_owner_id, "commercial_owner_id", "project.edit");
      }
      const values = [command.candidate_code, command.candidate_description, command.candidate_manufacturer, command.candidate_revision, command.candidate_item_key, command.proposal_reason, command.scope_quantity,
        JSON.stringify(command.criteria), JSON.stringify(command.impacts), command.commercial_state, command.commercial_state === "DecisionNeeded" ? command.commercial_owner_id : null];
      if (existing) {
        await c.query(`UPDATE ppo.material_substitutions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,candidate_code=$4,candidate_description=$5,candidate_manufacturer=$6,candidate_revision=$7,candidate_item_key=$8,reason=$9,scope_quantity=$10,criteria=$11,impacts=$12,commercial_state=$13,commercial_owner_id=$14,line_content_revision=$15,line_content_hash=$16 WHERE workspace_id=$1 AND id=$2`,
          [p.workspace_id, existing.s.id, p.actor_id, ...values, line.row.content_revision, line.row.content_hash]);
        return finish(existing.s.id, line.row.set_id, "SubstitutionDrafted");
      }
      await c.query(`INSERT INTO ppo.material_substitutions(id,workspace_id,company_id,set_id,line_id,created_by,updated_by,proposer_id,line_content_revision,line_content_hash,original_code,original_description,candidate_code,candidate_description,candidate_manufacturer,candidate_revision,candidate_item_key,reason,scope_quantity,criteria,impacts,commercial_state,commercial_owner_id)
        VALUES($1,$2,$3,$4,$5,$6,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [newId, p.workspace_id, access.pkg.company_id, line.row.set_id, line.row.id, p.actor_id, line.row.content_revision, line.row.content_hash,
          line.row.product_ref ?? line.row.model ?? `Line ${line.row.line_number}`, line.row.model ?? line.row.description, ...values]);
      return finish(newId, line.row.set_id, "SubstitutionProposed");
    }
    const { s, line } = await load(command.substitution_id, command.expected_version);
    if (command.action === "submit") {
      if (s.state !== "Draft") throw refuse("SubstitutionFrozen", "This comparison was already submitted.", 409);
      editable(line.loaded);
      // Missing evidence may be submitted for review. It can be returned, held or rejected; it can never be accepted.
      await c.query("UPDATE ppo.material_substitutions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Submitted',submitted_at=clock_timestamp(),submitted_hash=$4,line_content_revision=$5,line_content_hash=$6 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, s.id, p.actor_id, frozen(s, line.row.content_hash), line.row.content_revision, line.row.content_hash]);
      return finish(s.id, s.set_id, "SubstitutionSubmitted");
    }
    if (command.action === "decide") {
      if (!["Submitted", "Held"].includes(s.state)) throw refuse("NothingToDecide", "Only a submitted or held comparison can be decided.", 409);
      if (s.proposer_id === p.actor_id || (await contributors(c, p, [s.line_id])).has(p.actor_id)) throw new AppError(403, "IndependenceRequired", "You proposed this alternate or authored its line. Someone independent decides it.");
      authority(policyAllows(access.policy, p.actor_id, "TechnicalReviewer", [line.row.discipline], line.row.purpose));
      if (command.result === "Accepted") {
        const reasons = acceptanceBlockers(s.criteria);
        if (line.row.content_hash !== s.line_content_hash) reasons.push("The line changed after this comparison was submitted; it needs a corrected successor and a fresh decision.");
        if (frozen(s, s.line_content_hash) !== s.submitted_hash) reasons.push("The stored comparison no longer matches what was submitted.");
        for (const source of [line.loaded.drawing, line.loaded.basis]) if (source?.use !== "Current") reasons.push(`${source ? `${source.reference} revision ${source.revision} is ${source.use.toLowerCase()}` : "A required source is missing"}; no positive decision can rest on it.`);
        if (reasons.length) throw blocked("AcceptanceBlocked", reasons);
      }
      if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id");
      await c.query("UPDATE ppo.material_substitutions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state=$4,decided_by=$3,decided_at=clock_timestamp(),decision_rationale=$5,decision_owner_id=$6,decision_due=$7,policy_id=$8,policy_version=$9 WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, s.id, p.actor_id, command.result, command.rationale, command.owner_id, command.due, access.policy!.id, access.policy!.policy_version]);
      return finish(s.id, s.set_id, `Substitution${command.result}`, command.rationale);
    }
    if (command.action === "successor") {
      if (s.state !== "Returned") throw refuse("NotReturned", "Only a returned comparison is corrected through a successor. The returned one stays exactly as it was decided.", 409);
      if ((await c.query("SELECT 1 FROM ppo.material_substitutions WHERE workspace_id=$1 AND predecessor_id=$2", [p.workspace_id, s.id])).rowCount) throw refuse("SuccessorExists", "This comparison already has a corrected successor.", 409);
      editable(line.loaded);
      await c.query(`INSERT INTO ppo.material_substitutions(id,workspace_id,company_id,set_id,line_id,created_by,updated_by,proposer_id,line_content_revision,line_content_hash,original_code,original_description,candidate_code,candidate_description,candidate_manufacturer,candidate_revision,candidate_item_key,reason,scope_quantity,criteria,impacts,commercial_state,commercial_owner_id,predecessor_id)
        SELECT $3,workspace_id,company_id,set_id,line_id,$4,$4,$4,$5,$6,original_code,original_description,candidate_code,candidate_description,candidate_manufacturer,candidate_revision,candidate_item_key,reason,scope_quantity,criteria,impacts,
         CASE WHEN commercial_state='DecisionNeeded' THEN 'DecisionNeeded' ELSE 'NotAssessed' END,CASE WHEN commercial_state='DecisionNeeded' THEN commercial_owner_id END,id FROM ppo.material_substitutions WHERE workspace_id=$1 AND id=$2`,
        [p.workspace_id, s.id, command.id, p.actor_id, line.row.content_revision, line.row.content_hash]);
      return finish(command.id, s.set_id, "SubstitutionSuccessorCreated");
    }
    if (command.action === "commercial") {
      if (s.commercial_state !== "DecisionNeeded") throw refuse("NoDecisionRequested", "No commercial decision is waiting on this alternate.", 409);
      if (command.commercial_source_id) await packageSource(await loadSources(c, p, access), command.commercial_source_id, "commercial_source_id", ["CommercialDecision"]);
      await c.query("UPDATE ppo.material_substitutions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,commercial_state=$4,commercial_note=$5,commercial_source_id=$6,commercial_decided_by=$3,commercial_decided_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, s.id, p.actor_id, command.commercial_state, command.commercial_note, command.commercial_source_id]);
      return finish(s.id, s.set_id, "CommercialDecisionRecorded", command.commercial_note);
    }
    // adopt: the accepted candidate becomes the requirement through an explicit successor revision of the line.
    if (s.state !== "Accepted" || s.adopted_at) throw refuse("NotAdoptable", "Only an accepted alternate that has not been adopted can be adopted.", 409);
    editable(line.loaded);
    if (line.row.content_hash !== s.line_content_hash) throw refuse("AcceptanceStale", "The line changed after this alternate was accepted. That acceptance cannot authorise the changed content; propose and review it again.", 409);
    // The specified item's verified binding does not transfer to a different product: the candidate starts again at Proposed or Missing.
    const carries = !!s.candidate_item_key && !!line.row.mapping_configuration && !!line.row.mapping_entity && !!line.row.target_unit,
      merged: LineRecord = { ...line.row, product_ref: s.candidate_code, model: s.candidate_description, manufacturer: s.candidate_manufacturer,
        mapping: carries ? "Proposed" : "Missing", mapping_provider: carries ? "Synthetic" : null, mapping_item_key: carries ? s.candidate_item_key : null,
        mapping_item_description: carries ? s.candidate_description : null, mapping_configuration: carries ? line.row.mapping_configuration : null, mapping_entity: carries ? line.row.mapping_entity : null, mapping_candidates: [] };
    const { saved } = await updateLine(c, p, line.row, merged, ["product_ref", "model", "manufacturer", ...bindingColumns], { mapping_version: line.row.mapping_version + 1, mapping_observed_at: new Date(), mapping_verified_by: null });
    await record(c, p, access, command, { set_id: s.set_id, subject_type: "MaterialLine", subject_id: line.row.id, event_type: "CandidateAdopted", note: `Alternate ${s.candidate_code} adopted from accepted comparison ${s.id}. The original requirement is retained in the previous content revision.` });
    const adopted = await one<{ content_revision: number }>(c, "SELECT content_revision FROM ppo.material_lines WHERE workspace_id=$1 AND id=$2", [p.workspace_id, saved.id]);
    await c.query("UPDATE ppo.material_substitutions SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,adopted_at=clock_timestamp(),adopted_by=$3,adopted_content_revision=$4 WHERE workspace_id=$1 AND id=$2", [p.workspace_id, s.id, p.actor_id, adopted.content_revision]);
    return finish(s.id, s.set_id, "SubstitutionAdopted");
  }, "MaterialSubstitution", command.action === "decide" || command.action === "commercial" ? "MaterialDecisionRecorded" : "MaterialRecordSaved");
}

// ---------------------------------------------------------------------------------------------
type ReleaseRow = ReleaseRecord;
const structural = ["EmptyScope", "UnknownLine", "DuplicateLine", "InvalidQuantity", "OverAllocation", "KitContent", "DependencySplit"];
export async function releaseCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseReleaseCommand(value);
  const duty: Duty = command.action === "review" ? "review" : ["authorise", "issue", "withdraw"].includes(command.action) ? "release" : "edit";
  return sharedOperation<Access>(p, command, `MaterialRelease:${command.action}`, async (c) => {
    const access = await materialsAccess(c, p, packageId);
    // Cancelling an abandoned set is open to its release authority as well as to its authors.
    if (command.action === "cancel" && access.can.release) return access;
    requireDuty(access, duty);
    return access;
  }, async (c, access): Promise<Saved> => {
    const sources = await loadSources(c, p, access);
    const finish = async (id: string, setId: string, event: string, note: string | null = null) => {
      const saved = await one<Saved>(c, "SELECT id,version,CASE WHEN issue_state='Prepared' THEN review_state ELSE issue_state END AS state,updated_at FROM ppo.material_releases WHERE workspace_id=$1 AND id=$2", [p.workspace_id, id]);
      await record(c, p, access, command, { set_id: setId, subject_type: "MaterialRelease", subject_id: id, event_type: event, note });
      return saved;
    };
    if (command.action === "prepare") {
      const set = await setRow(c, p, access, command.set_id, true), lines = (await loadLines(c, p, set.id, sources)).filter((l) => !l.row.removed_at);
      const before = command.predecessor_id ? (await c.query<{ id: string; review_state: string; issue_state: string; withdrawn_at: Date | null; superseded_by: string | null }>("SELECT id,review_state,issue_state,withdrawn_at,superseded_by FROM ppo.material_releases WHERE workspace_id=$1 AND set_id=$2 AND id=$3", [p.workspace_id, set.id, command.predecessor_id])).rows[0] : undefined;
      if (command.predecessor_id && (!before || before.withdrawn_at || before.superseded_by || !(before.issue_state === "Issued" || ["Returned", "Cancelled"].includes(before.review_state))))
        throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "predecessor_id", message: "A successor follows a returned or cancelled set, or replaces an issued release that is still current." }]);
      const found = liveBlockers(lines, command.selection, command.purpose, await replaced(c, p, before?.issue_state === "Issued" ? before.id : null)).filter((b) => structural.includes(b.code));
      if (found.length) throw blocked("ScopeInvalid", found);
      for (const s of command.selection) if (lines.find((l) => l.row.id === s.line_id)!.locked) throw refuse("LineLocked", "A selected line is already inside a set under review. One line cannot sit in two live decisions.", 409);
      const chosen = new Map(command.selection.map((s) => [s.line_id, s.quantity])), used = new Set<string>();
      const manifestLines: ManifestLine[] = lines.filter((l) => chosen.has(l.row.id)).map((l) => {
        const r = l.row, quantity = chosen.get(l.row.id)!, conversion = lineConversion(l.row, quantity), ids = [l.drawing?.id, l.basis?.id].filter(Boolean) as string[];
        ids.forEach((id) => used.add(id));
        return {
          line_id: l.row.id, line_number: l.row.line_number, description: r.description, specification: r.specification, discipline: r.discipline, system_name: r.system_name, location: r.location,
          served_areas: r.served_areas, content_revision: l.row.content_revision, content_hash: l.row.content_hash, quantity, unit: l.row.unit, requirement_quantity: l.quantity,
          manufacturer: r.manufacturer, model: r.model, supplier_part: r.supplier_part, product_ref: r.product_ref, kit_role: r.kit_role, dependency_group: r.dependency_group,
          required_by: r.required_by, author_id: l.row.author_id,
          mapping: { condition: r.mapping, provider: r.mapping_provider, configuration: r.mapping_configuration, entity: r.mapping_entity, item_key: r.mapping_item_key, item_description: r.mapping_item_description, version: r.mapping_version },
          procurement: conversion?.ok ? { quantity: conversion.quantity, unit: conversion.unit, overage: conversion.overage, evidence: l.row.conversion_evidence } : null,
          // An adopted alternate travels with the exact decision that allowed it.
          substitution: l.proposal?.state === "Accepted" && l.proposal.adopted_at && l.proposal.submitted_hash && l.proposal.decided_by && l.proposal.adopted_content_revision
            ? { id: l.proposal.id, candidate_code: l.proposal.candidate_code, submitted_hash: l.proposal.submitted_hash, decided_by: l.proposal.decided_by, adopted_content_revision: l.proposal.adopted_content_revision } : null,
          source_ids: ids,
        };
      });
      const manifest: Manifest = {
        schema_version: 1,
        package: { id: access.pkg.id, reference: access.pkg.display_number, title: access.pkg.title, context_kind: access.pkg.context_kind, context_reference: access.pkg.context_reference, company_id: access.pkg.company_id, site_id: access.pkg.site_id },
        set: { id: set.id, code: set.set_code, revision: set.revision }, purpose: command.purpose, audience: command.audience, lines: manifestLines,
        exclusions: exclusions(lines, command.selection),
        sources: sources.filter((s) => used.has(s.id)).map((s) => ({ id: s.id, kind: s.kind, reference: s.reference, title: s.title, revision: s.revision, file_version: s.file_version, content_hash: s.content_hash, permitted_purpose: s.permitted_purpose, observed_at: s.observed_at })),
      };
      const number = (await one<{ next: number }>(c, "SELECT coalesce(max(release_number),0)+1 AS next FROM ppo.material_releases WHERE workspace_id=$1 AND set_id=$2", [p.workspace_id, set.id])).next;
      await c.query(`INSERT INTO ppo.material_releases(id,workspace_id,company_id,set_id,created_by,updated_by,prepared_by,release_number,set_revision,purpose,audience,manifest,content_hash,predecessor_id)
        VALUES($1,$2,$3,$4,$5,$5,$5,$6,$7,$8,$9,$10,$11,$12)`, [command.id, p.workspace_id, access.pkg.company_id, set.id, p.actor_id, number, set.revision, command.purpose, command.audience, JSON.stringify(manifest), sha256(manifest), before?.id ?? null]);
      for (const l of manifestLines) await c.query("INSERT INTO ppo.material_release_lines(workspace_id,company_id,release_id,line_id,content_revision,content_hash,quantity,unit) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [p.workspace_id, access.pkg.company_id, command.id, l.line_id, l.content_revision, l.content_hash, l.quantity, l.unit]);
      return finish(command.id, set.id, "ReleasePrepared");
    }
    const r = (await c.query<ReleaseRow>("SELECT r.* FROM ppo.material_releases r JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(r.workspace_id,r.set_id) WHERE r.workspace_id=$1 AND s.package_id=$2 AND r.id=$3 FOR UPDATE OF r", [p.workspace_id, access.pkg.id, command.release_id])).rows[0];
    if (!r) throw unavailable();
    currentVersion(r.version, command.expected_version);
    const lines = (await loadLines(c, p, r.set_id, sources)).filter((l) => !l.row.removed_at),
      found = () => replaced(c, p, r.predecessor_id).then((map) => liveBlockers(lines, r.manifest.lines, r.purpose, map)),
      disciplines = [...new Set(r.manifest.lines.map((l) => l.discipline))],
      inside = new Set(r.manifest.lines.map((l) => l.line_id)),
      // Whoever prepared the set, authored or changed its lines, or proposed an alternate inside it.
      involved = new Set([r.prepared_by, ...r.manifest.lines.map((l) => l.author_id), ...(await contributors(c, p, [...inside])), ...lines.flatMap((l) => (inside.has(l.row.id) && l.proposal ? [l.proposal.proposer_id] : []))]);
    const set = (sql: string, values: unknown[]) => c.query(`UPDATE ppo.material_releases SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,${sql} WHERE workspace_id=$1 AND id=$2`, [p.workspace_id, r.id, p.actor_id, ...values]);
    if (sha256(r.manifest) !== r.content_hash) throw refuse("ManifestTampered", "The stored manifest no longer matches its content hash. Nothing can be decided on it.", 409);

    if (command.action === "cancel") {
      if (r.issue_state === "Issued" || r.review_state === "Cancelled") throw refuse("NotCancellable", "An issued release is never cancelled; its current use can be withdrawn. A cancelled set stays cancelled.", 409);
      await set("review_state='Cancelled'", []);
      return finish(r.id, r.set_id, "ReleaseCancelled");
    }
    if (command.action === "submit") {
      if (!["Draft"].includes(r.review_state) || r.issue_state !== "Prepared") throw refuse("NotSubmittable", "Only a prepared draft set is submitted. A returned set is corrected through a successor.", 409);
      const stops = await found();
      if (stops.length) throw blocked("ReleaseBlocked", stops);
      await set("review_state='Submitted',submitted_at=clock_timestamp()", []);
      return finish(r.id, r.set_id, "ReleaseSubmitted");
    }
    if (command.action === "review") {
      if (!["Submitted", "Held"].includes(r.review_state) || r.issue_state !== "Prepared") throw refuse("NothingToReview", "Only a submitted or held set can be reviewed.", 409);
      if (involved.has(p.actor_id)) throw new AppError(403, "IndependenceRequired", "You prepared this set or authored content in it. Someone independent reviews it.");
      authority(policyAllows(access.policy, p.actor_id, "TechnicalReviewer", disciplines, r.purpose));
      if (command.result === "Accepted") { const stops = await found(); if (stops.length) throw blocked("ReleaseBlocked", stops); }
      if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id");
      await set("review_state=$4,reviewed_by=$3,reviewed_at=clock_timestamp(),review_rationale=$5,review_owner_id=$6,review_due=$7,policy_id=$8,policy_version=$9",
        [command.result === "Accepted" ? "TechnicallyReviewed" : command.result, command.rationale, command.owner_id, command.due, access.policy!.id, access.policy!.policy_version]);
      return finish(r.id, r.set_id, `Release${command.result === "Accepted" ? "TechnicallyReviewed" : command.result}`, command.rationale);
    }
    if (command.action === "withdraw") {
      if (r.issue_state !== "Issued" || r.withdrawn_at) throw refuse("NotWithdrawable", "Only a current issued release can have its use withdrawn.", 409);
      authority(policyAllows(access.policy, p.actor_id, "ReleaseAuthority", disciplines, r.purpose));
      await set("withdrawn_at=clock_timestamp(),withdrawn_by=$3,withdrawn_reason=$4", [command.reason]);
      await raiseImpact(c, p, access, command, { release_id: r.id }, "Withdrawn", null);
      return finish(r.id, r.set_id, "ReleaseWithdrawn", command.reason);
    }
    // authorise and issue: the same people, the same checks, made twice on purpose.
    if (involved.has(p.actor_id)) throw new AppError(403, "IndependenceRequired", "You prepared this set or authored content in it. It cannot be released by you.");
    if (r.reviewed_by === p.actor_id && !access.policy?.allow_reviewer_release_overlap) throw new AppError(403, "IndependenceRequired", "The policy does not let the reviewer of a set also release it.");
    authority(policyAllows(access.policy, p.actor_id, "ReleaseAuthority", disciplines, r.purpose));
    // A second equivalent issue is never created: the original operation is the only way back to an issued result. This is
    // answered before anything else is assessed, because an issued release's own entitlement would otherwise read as a blocker.
    if (r.issue_state === "Issued") throw refuse("AlreadyIssued", `This release was issued by operation ${r.issue_operation_id}. Recover that original result; nothing is issued twice.`, 409);
    if (r.review_state !== "TechnicallyReviewed") throw refuse("NotReviewed", "Only an independently reviewed set can be authorised or issued.", 409);
    if (r.policy_version !== access.policy!.policy_version) throw refuse("PolicyChanged", `This set was reviewed under policy version ${r.policy_version}; version ${access.policy!.policy_version} now applies. It needs a fresh review.`, 409);
    const stops = await found();
    if (stops.length) throw blocked("ReleaseBlocked", stops);
    if (command.action === "authorise") {
      if (r.issue_state !== "Prepared") throw refuse("AlreadyAuthorised", "This set is already authorised.", 409);
      await set("issue_state='Authorised',authorised_by=$3,authorised_at=clock_timestamp(),authorised_hash=$4", [r.content_hash]);
      return finish(r.id, r.set_id, "ReleaseAuthorised");
    }
    if (r.issue_state !== "Authorised") throw refuse("NotAuthorised", "Authorise this exact set before issuing it.", 409);
    if (r.predecessor_id) await c.query("UPDATE ppo.material_releases SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,superseded_by=$4 WHERE workspace_id=$1 AND id=$2 AND issue_state='Issued' AND withdrawn_at IS NULL AND superseded_by IS NULL", [p.workspace_id, r.predecessor_id, p.actor_id, r.id]);
    await set("issue_state='Issued',issued_by=$3,issued_at=clock_timestamp(),issue_operation_id=$4", [command.operation_id]);
    return finish(r.id, r.set_id, "ReleaseIssued");
  }, "MaterialRelease", command.action === "issue" ? "MaterialReleaseIssued" : ["review", "authorise", "withdraw"].includes(command.action) ? "MaterialDecisionRecorded" : "MaterialRecordSaved");
}

// ---------------------------------------------------------------------------------------------
export async function handoverCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseHandoverCommand(value);
  return sharedOperation<Access>(p, command, `MaterialHandover:${command.action}`, async (c) => {
    const access = await materialsAccess(c, p, packageId);
    requireDuty(access, command.action === "decide" ? "receive" : "edit");
    return access;
  }, async (c, access): Promise<Saved> => {
    const sources = await loadSources(c, p, access);
    const releaseOf = async (id: string) => {
      const row = (await c.query<ReleaseRow>("SELECT r.* FROM ppo.material_releases r JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(r.workspace_id,r.set_id) WHERE r.workspace_id=$1 AND s.package_id=$2 AND r.id=$3 FOR SHARE OF r", [p.workspace_id, access.pkg.id, id])).rows[0];
      if (!row) throw unavailable();
      return { row, view: presentRelease(row, await loadLines(c, p, row.set_id, sources), sources) };
    };
    const finish = async (id: string, setId: string, event: string, note: string | null = null) => {
      const saved = await one<Saved>(c, "SELECT id,version,state,updated_at FROM ppo.material_handovers WHERE workspace_id=$1 AND id=$2", [p.workspace_id, id]);
      await record(c, p, access, command, { set_id: setId, subject_type: "MaterialHandover", subject_id: id, event_type: event, note });
      return saved;
    };
    if (command.action === "prepare") {
      const { row: r, view } = await releaseOf(command.release_id), stops: string[] = [];
      if (view.current_use !== "EligibleForPurpose") stops.push(`Release ${view.release_number} is ${view.current_use === "NotAssessed" ? "not issued" : view.current_use.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}. ${view.current_use_reasons.join(" ")}`.trim());
      if (command.requested_action === "ProcurementReady") {
        if (r.purpose !== "TechnicalReleaseForProcurement") stops.push("An information-only release cannot be received as procurement-ready.");
        if (access.pkg.context_kind !== "Project") stops.push("This package belongs to an Opportunity, which is presales context. Procurement-ready receiving needs an awarded Project; nothing here pretends one exists.");
        for (const l of r.manifest.lines) {
          if (l.mapping.condition !== "Verified") stops.push(`Line ${l.line_number}: procurement-ready receiving needs a verified item mapping.`);
          if (!l.procurement) stops.push(`Line ${l.line_number}: the procurement quantity is unresolved.`);
        }
        const undecided = (await c.query<{ line_number: string }>("SELECT l.line_number FROM ppo.material_substitutions s JOIN ppo.material_lines l ON (l.workspace_id,l.id)=(s.workspace_id,s.line_id) WHERE s.workspace_id=$1 AND s.line_id=ANY($2::uuid[]) AND s.commercial_state='DecisionNeeded' AND s.state<>'Rejected'", [p.workspace_id, r.manifest.lines.map((l) => l.line_id)])).rows;
        for (const u of undecided) stops.push(`Line ${u.line_number}: a commercial decision is outstanding with its owner. Technical acceptance does not settle it.`);
      }
      const demand = await packageSource(sources, command.demand_source_id, "demand_source_id", ["DemandAuthority"]);
      if (demand && (demand.use !== "Current" || demand.permitted_purpose !== "Procurement")) stops.push(`${demand.reference} revision ${demand.revision} is not current procurement demand authority.`);
      if (stops.length) throw blocked("HandoverBlocked", stops);
      await eligiblePerson(c, p, access, command.receiver_id, "receiver_id", "engineering.material.receive");
      if (!access.policy?.grants.some((g) => g.actor_id === command.receiver_id && g.role === "SupplyReceiver")) throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "receiver_id", message: access.policy ? "The policy does not name this person as a Supply Chain receiver." : "Authority not configured: no policy names a receiver." }]);
      const open = (await c.query<{ state: string }>("SELECT state FROM ppo.material_handovers WHERE workspace_id=$1 AND release_id=$2 AND state<>'Returned'", [p.workspace_id, r.id])).rows[0];
      if (open) throw refuse("HandoverExists", open.state === "Accepted" ? "This exact release was already received. A changed payload needs a successor release, not a second handover." : "A handover of this release is already in progress.", 409);
      const before = command.predecessor_id ? (await c.query<{ id: string; revision: number; state: string }>("SELECT id,revision,state FROM ppo.material_handovers WHERE workspace_id=$1 AND set_id=$2 AND id=$3", [p.workspace_id, r.set_id, command.predecessor_id])).rows[0] : undefined;
      if (command.predecessor_id && (before?.state !== "Returned" || (await c.query("SELECT 1 FROM ppo.material_handovers WHERE workspace_id=$1 AND predecessor_id=$2", [p.workspace_id, command.predecessor_id])).rowCount))
        throw new AppError(422, "InvalidData", "Check the highlighted details.", [{ field: "predecessor_id", message: "A corrected handover follows a returned one that has no successor yet." }]);
      const payload = {
        schema_version: 1, requested_action: command.requested_action,
        source: { release_id: r.id, release_number: view.release_number, set_revision: view.set_revision, purpose: r.purpose, content_hash: view.content_hash, issue_operation_id: view.issue_operation_id, issued_at: view.issued_at, sources: r.manifest.sources },
        context: { ...r.manifest.package, site_name: access.site_name, engineering_package: access.pkg.display_number },
        lines: r.manifest.lines, exclusions: r.manifest.exclusions,
        demand: { basis: command.demand_basis, authority: demand ? { id: demand.id, reference: demand.reference, revision: demand.revision, content_hash: demand.content_hash } : null },
        timing: { required_by: command.required_by, timezone: command.required_by ? access.site_timezone ?? "Australia/Brisbane" : null },
        receiving: { receiver_id: command.receiver_id, coordinator_id: p.actor_id, schema_version: 1 },
      };
      await c.query(`INSERT INTO ppo.material_handovers(id,workspace_id,company_id,set_id,release_id,created_by,updated_by,revision,predecessor_id,requested_action,demand_basis,demand_source_id,receiver_id,coordinator_id,required_by,required_by_timezone,payload,payload_hash)
        VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$6,$13,$14,$15,$16)`, [command.id, p.workspace_id, access.pkg.company_id, r.set_id, r.id, p.actor_id, (before?.revision ?? 0) + 1, before?.id ?? null, command.requested_action,
        command.demand_basis, command.demand_source_id, command.receiver_id, command.required_by, payload.timing.timezone, JSON.stringify(payload), sha256(payload)]);
      return finish(command.id, r.set_id, "HandoverPrepared");
    }
    const h = (await c.query<Record<string, unknown> & { id: string; version: number; set_id: string; release_id: string; state: string; receiver_id: string; payload: unknown; payload_hash: string; created_by: string }>(
      "SELECT h.* FROM ppo.material_handovers h JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(h.workspace_id,h.set_id) WHERE h.workspace_id=$1 AND s.package_id=$2 AND h.id=$3 FOR UPDATE OF h", [p.workspace_id, access.pkg.id, command.handover_id])).rows[0];
    if (!h) throw unavailable();
    currentVersion(h.version, command.expected_version);
    if (command.action === "send") {
      if (h.state !== "Prepared") throw refuse("AlreadySent", "This payload was already sent to its receiver.", 409);
      await c.query("UPDATE ppo.material_handovers SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='AwaitingReceiver',sent_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2", [p.workspace_id, h.id, p.actor_id]);
      return finish(h.id, h.set_id, "HandoverSent");
    }
    if (h.state === "Accepted" || h.state === "Returned") throw refuse("AlreadyDecided", `This exact payload was already ${h.state.toLowerCase()} by operation ${h.outcome_operation_id}. Recover that original outcome; it is never decided twice.`, 409);
    if (h.state !== "AwaitingReceiver") throw refuse("NotSent", "This payload has not been sent to its receiver.", 409);
    if (h.receiver_id !== p.actor_id || h.created_by === p.actor_id) throw new AppError(403, "IndependenceRequired", "A payload is decided by the receiver it names, never by whoever prepared it.");
    const { row: r, view } = await releaseOf(h.release_id);
    authority(policyAllows(access.policy, p.actor_id, "SupplyReceiver", [], r.purpose));
    if (sha256(h.payload) !== h.payload_hash) throw refuse("PayloadTampered", "The stored payload no longer matches its hash. It cannot be decided.", 409);
    if (command.result === "Accepted" && view.current_use !== "EligibleForPurpose") throw blocked("HandoverBlocked", [`Release ${view.release_number} is no longer eligible for this purpose. ${view.current_use_reasons.join(" ")} Return the payload, or wait for the reassessment.`]);
    if (command.owner_id) await eligiblePerson(c, p, access, command.owner_id, "owner_id", "engineering.edit");
    await c.query("UPDATE ppo.material_handovers SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state=$4,decided_by=$3,decided_at=clock_timestamp(),outcome_operation_id=$5,decision_reasons=$6,return_owner_id=$7,return_due=$8 WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, h.id, p.actor_id, command.result, command.operation_id, JSON.stringify(command.reasons), command.owner_id, command.due]);
    // Acceptance records that this exact payload was received. It creates no order, reservation, receipt or booking.
    return finish(h.id, h.set_id, `Handover${command.result}`);
  }, "MaterialHandover", command.action === "decide" ? "MaterialHandoverDecided" : "MaterialRecordSaved");
}

export async function impactCommand(p: Principal, packageId: string, value: unknown) {
  const command = parseImpactCommand(value);
  return sharedOperation<Access>(p, command, "MaterialImpact:resolve", (c) => materialsAccess(c, p, packageId), async (c, access): Promise<Saved> => {
    const i = (await c.query<{ id: string; version: number; set_id: string; owner_id: string; state: string }>("SELECT i.id,i.version,i.set_id,i.owner_id,i.state FROM ppo.material_impacts i JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(i.workspace_id,i.set_id) WHERE i.workspace_id=$1 AND s.package_id=$2 AND i.id=$3 FOR UPDATE OF i", [p.workspace_id, access.pkg.id, command.impact_id])).rows[0];
    if (!i) throw unavailable();
    currentVersion(i.version, command.expected_version);
    if (i.owner_id !== p.actor_id && !access.can.edit) throw new AppError(403, "Forbidden", "This follow-up is closed by its owner or an Engineering author.");
    if (i.state === "Resolved") throw refuse("AlreadyResolved", "This follow-up is already resolved.", 409);
    const saved = await one<Saved>(c, "UPDATE ppo.material_impacts SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Resolved',resolution=$4,resolved_by=$3,resolved_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING id,version,state,updated_at", [p.workspace_id, i.id, p.actor_id, command.resolution]);
    await record(c, p, access, command, { set_id: i.set_id, subject_type: "MaterialImpact", subject_id: i.id, event_type: "ImpactResolved", note: command.resolution });
    return saved;
  }, "MaterialImpact", "MaterialDecisionRecorded");
}

// Original-operation recovery rechecks present access, by the same duty the command needed, before any receipt is disclosed.
export async function materialReceiptAuthority(c: QueryClient, p: Principal, objectType: string, recordId: string, commandName: string) {
  const table = { MaterialSet: "material_sets", MaterialSource: "material_sources", MaterialLine: "material_lines", MaterialSubstitution: "material_substitutions", MaterialRelease: "material_releases", MaterialHandover: "material_handovers", MaterialImpact: "material_impacts" }[objectType];
  if (!table) throw unavailable();
  const owner = (await c.query<{ package_id: string }>(
    table === "material_sets" || table === "material_sources" ? `SELECT package_id FROM ppo.${table} WHERE workspace_id=$1 AND id=$2`
      : `SELECT s.package_id FROM ppo.${table} t JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(t.workspace_id,t.set_id) WHERE t.workspace_id=$1 AND t.id=$2`, [p.workspace_id, recordId])).rows[0];
  if (!owner) throw unavailable();
  const access = await materialsAccess(c, p, owner.package_id), action = commandName.split(":")[1];
  const duty: Duty | null = objectType === "MaterialSource" ? "source" : objectType === "MaterialImpact" ? null : objectType === "MaterialHandover" && action === "decide" ? "receive"
    : objectType === "MaterialRelease" && ["authorise", "issue", "withdraw"].includes(action) ? "release" : (objectType === "MaterialRelease" && action === "review") || (objectType === "MaterialSubstitution" && action === "decide") ? "review"
    : objectType === "MaterialSubstitution" && action === "commercial" ? "commercial" : objectType === "MaterialLine" && action === "binding" ? null : "edit";
  if (duty && !access.can[duty]) throw unavailable();
  if (!duty && !access.can.edit && !access.can.source) throw unavailable();
}
