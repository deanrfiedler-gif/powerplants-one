// The shared inspection core's server side. Every function here runs inside the caller's transaction and
// takes the caller's already-authorised context: this module owns attempts, results, evidence, review, defects
// and retest lineage for a typed host, and knows nothing about commissioning. EN-08 is its first consumer; a
// later FI-03/FI-04 workspace reads and writes these same rows through these same functions.
import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { ActivityInput } from "../activities/activities";
import { authoriseActivityInput, insertActivity } from "../activities/activities";
import { documentStore, digest } from "../documents/store";
import { entryContext } from "../field/context";
import { inspectPng } from "../field/media";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { canonical } from "../platform/operations";
import type { QueryClient } from "../platform/permissions";
import { visibleAppointment } from "../scheduling/planner";
import {
  assessInstrument, evaluate, submissionBlockers,
  type Calibration, type CheckDefinition, type DefectState, type Evaluation, type EvidenceState, type Host, type InstrumentAssessment, type Prerequisite, type Reading, type ReviewDecision, type ReviewState,
} from "./model";

// The version of the evaluation rules in ./model. It is stored beside every evaluation it produced, so a later
// change to the rules never silently re-judges a retained result.
export const ruleVersion = "inspection-rules-1";
const sha256 = (value: unknown) => createHash("sha256").update(typeof value === "string" ? value : canonical(value)).digest("hex");
const refuse = (code: string, message: string, status = 422) => new AppError(status, code, message);
const blocked = (code: string, reasons: string[]) => new AppError(422, code, reasons.slice(0, 6).join(" "), reasons.slice(0, 30).map((message) => ({ field: "attempt", message })));

// ---------------------------------------------------------------------------------------------
// Hosts. A Project commissioning scope is authorised by its consumer before it reaches this module. A Service
// appointment keeps every restriction the field runtime already places on it: the caller must hold the live
// assignment, so no attendance control is bypassed and no appointment is ever invented for a project test.
export type ResolvedHost = Host & { company_id: string; site_id: string | null };
export async function resolveHost(c: QueryClient, p: Principal, host: Host): Promise<ResolvedHost> {
  if (host.host_type === "ServiceAppointment") {
    const { a } = await visibleAppointment(c, p, host.host_id, "field.read.own");
    return { ...host, company_id: a.company_id, site_id: a.site_id };
  }
  const row = (await c.query<{ company_id: string; site_id: string | null }>("SELECT company_id,site_id FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2 AND archived_at IS NULL", [p.workspace_id, host.host_id])).rows[0];
  if (!row) throw unavailable();
  return { ...host, ...row };
}

// ---------------------------------------------------------------------------------------------
export type AttemptRow = {
  id: string; company_id: string; site_id: string | null; host_type: Host["host_type"]; host_id: string; version: number; created_at: Date; created_by: string; updated_at: Date;
  attempt_number: number; predecessor_id: string | null; state: "Draft" | "Submitted"; plan_source: { type: string; id: string; reference: string; hash: string }; plan: CheckDefinition[]; plan_hash: string;
  scope_keys: string[]; check_keys: string[]; configuration_reference: string | null; configuration_source_id: string | null; performer_id: string; occurred_at: Date | null; timezone: string | null; clock_concern: string | null;
  prerequisites: Prerequisite[]; findings: string | null; content_hash: string; submitted_hash: string | null; submitted_at: Date | null; submitted_by: string | null; received_at: Date | null; performer_name: string;
};
export type ResultRow = { id: string; attempt_id: string; check_key: string; entry_state: Reading["state"]; raw_value: string | null; unit: string | null; choice: string | null; reason: string | null; note: string | null; evaluation: Evaluation | null; evaluation_reason: string | null; compared: string | null; rule_version: string | null };
export type EvidenceRow = { id: string; attempt_id: string; check_key: string | null; kind: "RetainedSource" | "FieldEntry" | "StoredFile"; source_id: string | null; field_entry_id: string | null; field_entry_revision: number | null; storage_id: string | null; label: string; purpose: string; media_type: string | null; byte_count: number | null; content_hash: string | null; access_class: "Internal" | "CustomerSafe"; state: EvidenceState; added_by: string; added_at: Date; added_by_name: string };
export type InstrumentRow = { id: string; reference: string; description: string; calibration_reference: string; calibration_version: string; valid_from: string; valid_to: string; withdrawn_effective_from: string | null; withdrawn_reason: string | null; withdrawn_recorded_at: Date | null };
export type InstrumentUseRow = { attempt_id: string; instrument_id: string; snapshot: Omit<InstrumentRow, "id" | "withdrawn_recorded_at"> };
export type ReviewRow = { id: string; attempt_id: string; decision: ReviewDecision | "ClarificationProvided"; reason: string; submitted_hash: string; owner_id: string | null; due: string | null; policy: Record<string, unknown>; independence_required: boolean; operation_id: string; decided_by: string; decided_at: Date; decided_by_name: string; owner_name: string | null };
export type DefectRow = {
  id: string; host_type: Host["host_type"]; host_id: string; version: number; defect_number: number; reference: string; check_key: string; scope_key: string | null; title: string; severity: string; state: DefectState; owner_id: string; due: string;
  retest_required: boolean; proposed_correction: string | null; correction_note: string | null; correction_by: string | null; correction_at: Date | null; changes_system: boolean; change_id: string | null; activity_id: string | null;
  source_attempt_id: string; closed_by_attempt_id: string | null; closed_review_id: string | null; closed_at: Date | null; created_at: Date; owner_name: string; correction_by_name: string | null;
  activity: { status: string; owner_name: string; due_at: Date | null; outcome: string | null } | null;
};
export type DefectLink = { defect_id: string; attempt_id: string; relation: "Raised" | "Repeated" | "Retest" };

// The frozen content of an attempt: what a review, a defect and a release manifest bind to. Evidence is named
// by identity and exact hash, so a changed file is a changed attempt.
export function attemptHash(a: Pick<AttemptRow, "plan_hash" | "scope_keys" | "check_keys" | "configuration_reference" | "configuration_source_id" | "performer_id" | "timezone" | "clock_concern" | "prerequisites" | "findings"> & { occurred_at: string | null },
  results: Pick<ResultRow, "check_key" | "entry_state" | "raw_value" | "unit" | "choice" | "reason" | "note">[], instruments: { instrument_id: string; snapshot: unknown }[], evidence: Pick<EvidenceRow, "id" | "check_key" | "kind" | "content_hash" | "label" | "purpose" | "access_class">[]) {
  const by = <T>(rows: T[], key: (row: T) => string) => [...rows].sort((x, y) => key(x).localeCompare(key(y)));
  return sha256({
    plan_hash: a.plan_hash, scope_keys: [...a.scope_keys].sort(), check_keys: [...a.check_keys].sort(), configuration_reference: a.configuration_reference, configuration_source_id: a.configuration_source_id, performer_id: a.performer_id,
    occurred_at: a.occurred_at, timezone: a.timezone, clock_concern: a.clock_concern, prerequisites: a.prerequisites, findings: a.findings,
    results: by(results, (r) => r.check_key).map(({ check_key, entry_state, raw_value, unit, choice, reason, note }) => ({ check_key, entry_state, raw_value, unit, choice, reason, note })),
    instruments: by(instruments, (i) => i.instrument_id), evidence: by(evidence, (e) => e.id).map(({ id, check_key, kind, content_hash, label, purpose, access_class }) => ({ id, check_key, kind, content_hash, label, purpose, access_class })),
  });
}
export const planHash = (plan: CheckDefinition[]) => sha256([...plan].sort((a, b) => a.key.localeCompare(b.key)));
const toReading = (r: ResultRow, evidence: EvidenceRow[]): Reading => ({ check_key: r.check_key, state: r.entry_state, value: r.raw_value, unit: r.unit, choice: r.choice, reason: r.reason, note: r.note, evidence_ids: evidence.filter((e) => e.check_key === r.check_key).map((e) => e.id) });

// ---------------------------------------------------------------------------------------------
// Everything the core holds for a set of hosts, in a fixed handful of queries.
export type LoadedAttempt = { row: AttemptRow; results: ResultRow[]; evidence: EvidenceRow[]; instruments: (InstrumentUseRow & { live: InstrumentRow | null; assessment: InstrumentAssessment; reason: string | null; expired_today: boolean })[]; reviews: ReviewRow[]; review: ReviewState; defects: DefectLink[] };
export async function loadInspections(c: QueryClient, p: Principal, hostType: Host["host_type"], hostIds: string[], today: string) {
  const args = [p.workspace_id, hostType, hostIds], user = (alias: string, column: string, inner = false) => `${inner ? "" : "LEFT "}JOIN ppo.users ${alias} ON (${alias}.workspace_id,${alias}.id)=(t.workspace_id,t.${column})`;
  const viaAttempt = "JOIN ppo.inspection_attempts a ON (a.workspace_id,a.id)=(t.workspace_id,t.attempt_id) WHERE t.workspace_id=$1 AND a.host_type=$2 AND a.host_id=ANY($3::uuid[])";
  const q = async <T extends Record<string, unknown>>(sql: string) => (hostIds.length ? (await c.query<T>(sql, args)).rows : []);
  const attempts = await q<AttemptRow>(`SELECT t.*,pf.display_name AS performer_name FROM ppo.inspection_attempts t ${user("pf", "performer_id", true)} WHERE t.workspace_id=$1 AND t.host_type=$2 AND t.host_id=ANY($3::uuid[]) ORDER BY t.attempt_number`),
    results = await q<ResultRow>(`SELECT t.* FROM ppo.inspection_results t ${viaAttempt} ORDER BY t.sort_order,t.check_key`),
    evidence = await q<EvidenceRow>(`SELECT t.*,ad.display_name AS added_by_name FROM ppo.inspection_evidence t ${user("ad", "added_by", true)} ${viaAttempt} ORDER BY t.added_at,t.id`),
    uses = await q<InstrumentUseRow>(`SELECT t.attempt_id,t.instrument_id,t.snapshot FROM ppo.inspection_instrument_uses t ${viaAttempt}`),
    reviews = await q<ReviewRow>(`SELECT t.*,t.due::text,db.display_name AS decided_by_name,ow.display_name AS owner_name FROM ppo.inspection_reviews t ${user("db", "decided_by", true)} ${user("ow", "owner_id")} ${viaAttempt} ORDER BY t.decided_at,t.id`),
    defects = await q<DefectRow>(`SELECT t.*,t.due::text,ow.display_name AS owner_name,cb.display_name AS correction_by_name,
      (SELECT jsonb_build_object('status',x.status,'owner_name',xu.display_name,'due_at',x.due_at,'outcome',x.outcome) FROM ppo.activities x JOIN ppo.users xu ON (xu.workspace_id,xu.id)=(x.workspace_id,x.owner_id) WHERE (x.workspace_id,x.id)=(t.workspace_id,t.activity_id)) AS activity
      FROM ppo.inspection_defects t ${user("ow", "owner_id", true)} ${user("cb", "correction_by")} WHERE t.workspace_id=$1 AND t.host_type=$2 AND t.host_id=ANY($3::uuid[]) ORDER BY t.defect_number`),
    links = await q<DefectLink>("SELECT t.defect_id,t.attempt_id,t.relation FROM ppo.inspection_defect_attempts t JOIN ppo.inspection_defects d ON (d.workspace_id,d.id)=(t.workspace_id,t.defect_id) WHERE t.workspace_id=$1 AND d.host_type=$2 AND d.host_id=ANY($3::uuid[])");
  const instrumentIds = [...new Set(uses.map((u) => u.instrument_id))];
  const live = instrumentIds.length ? (await c.query<InstrumentRow>(`SELECT ${instrumentColumns},withdrawn_recorded_at FROM ppo.inspection_instruments WHERE workspace_id=$1 AND id=ANY($2::uuid[])`, [p.workspace_id, instrumentIds])).rows : [];
  const loaded: LoadedAttempt[] = attempts.map((row) => {
    const mine = reviews.filter((r) => r.attempt_id === row.id), occurred = row.occurred_at ? localDate(row.occurred_at, row.timezone) : null;
    return {
      row, results: results.filter((r) => r.attempt_id === row.id), evidence: evidence.filter((e) => e.attempt_id === row.id), reviews: mine, review: reviewState(row.state, mine), defects: links.filter((l) => l.attempt_id === row.id),
      instruments: uses.filter((u) => u.attempt_id === row.id).map((u) => {
        const now = live.find((i) => i.id === u.instrument_id) ?? null, calibration = now ? calibrationOf(now) : null;
        // Assessed against the live record, so a retrospective withdrawal reaches a retained attempt; the snapshot shows what was relied on.
        return { ...u, live: now, ...(occurred ? assessInstrument(calibration, occurred) : { assessment: "Unknown" as const, reason: "The test time is not recorded yet." }), expired_today: !!calibration && today > calibration.valid_to };
      }),
    };
  });
  return { attempts: loaded, defects, links };
}
export const instrumentColumns = "id,reference,description,calibration_reference,calibration_version,valid_from::text,valid_to::text,withdrawn_effective_from::text,withdrawn_reason";
export const calibrationOf = (i: Pick<InstrumentRow, "calibration_reference" | "calibration_version" | "valid_from" | "valid_to" | "withdrawn_effective_from" | "withdrawn_reason">): Calibration =>
  ({ reference: i.calibration_reference, version: i.calibration_version, valid_from: i.valid_from, valid_to: i.valid_to, withdrawn_effective_from: i.withdrawn_effective_from, withdrawn_reason: i.withdrawn_reason });
// The calendar date of an instant at the site. A test at 23:30 site time is that site day's test, wherever the server runs.
export function localDate(instant: Date, timezone: string | null) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  return `${parts.find((x) => x.type === "year")!.value}-${parts.find((x) => x.type === "month")!.value}-${parts.find((x) => x.type === "day")!.value}`;
}
// The latest decision says where the attempt stands; every earlier one is still there to be read.
export function reviewState(state: AttemptRow["state"], reviews: Pick<ReviewRow, "decision">[]): ReviewState {
  if (state === "Draft") return "NotSubmitted";
  const last = reviews.at(-1)?.decision;
  return !last || last === "ClarificationProvided" ? "InReview" : last;
}

// ---------------------------------------------------------------------------------------------
export type OpenInput = { id: string; host: ResolvedHost; plan_source: AttemptRow["plan_source"]; plan: CheckDefinition[]; scope_keys: string[]; check_keys: string[]; predecessor_id: string | null; performer_id: string; prerequisites: Prerequisite[]; timezone: string | null };
export async function openAttempt(c: PoolClient, p: Principal, input: OpenInput) {
  const known = new Set(input.plan.map((d) => d.key));
  if (!input.check_keys.length || input.check_keys.some((k) => !known.has(k))) throw refuse("InvalidData", "Choose checks of the approved test basis.");
  // A draft in progress is finished or abandoned in words before another is opened: two live drafts would race for one defect.
  const draft = (await c.query<{ attempt_number: number }>("SELECT attempt_number FROM ppo.inspection_attempts WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3 AND state='Draft' LIMIT 1", [p.workspace_id, input.host.host_type, input.host.host_id])).rows[0];
  if (draft) throw refuse("DraftOpen", `Attempt ${String(draft.attempt_number).padStart(2, "0")} is still a draft. Submit it before opening another.`, 409);
  const number = (await c.query<{ next: number }>("SELECT coalesce(max(attempt_number),0)+1 AS next FROM ppo.inspection_attempts WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3", [p.workspace_id, input.host.host_type, input.host.host_id])).rows[0].next;
  const hash = planHash(input.plan), empty = { plan_hash: hash, scope_keys: input.scope_keys, check_keys: input.check_keys, configuration_reference: null, configuration_source_id: null, performer_id: input.performer_id, occurred_at: null, timezone: input.timezone, clock_concern: null, prerequisites: input.prerequisites, findings: null };
  await c.query(`INSERT INTO ppo.inspection_attempts(id,workspace_id,company_id,site_id,host_type,host_id,created_by,updated_by,attempt_number,predecessor_id,plan_source,plan,plan_hash,scope_keys,check_keys,performer_id,timezone,prerequisites,content_hash)
    VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [input.id, p.workspace_id, input.host.company_id, input.host.site_id, input.host.host_type, input.host.host_id, p.actor_id, number, input.predecessor_id, JSON.stringify(input.plan_source), JSON.stringify(input.plan), hash, JSON.stringify(input.scope_keys), JSON.stringify(input.check_keys),
      input.performer_id, input.timezone, JSON.stringify(input.prerequisites), attemptHash(empty, [], [], [])]);
  return number;
}

export type SaveInput = { configuration_reference: string | null; configuration_source_id: string | null; occurred_at: string | null; timezone: string | null; clock_concern: string | null; prerequisites: Prerequisite[]; findings: string | null; readings: Reading[]; instrument_ids: string[] };
async function lockDraft(c: PoolClient, p: Principal, host: Host, attemptId: string, expectedVersion: number) {
  const row = (await c.query<AttemptRow>("SELECT * FROM ppo.inspection_attempts WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3 AND id=$4 FOR UPDATE", [p.workspace_id, host.host_type, host.host_id, attemptId])).rows[0];
  if (!row) throw unavailable();
  if (row.version !== expectedVersion) throw new AppError(409, "VersionConflict", "This attempt changed while you were working. Your entries are retained; review the latest version before saving again.");
  if (row.state !== "Draft") throw refuse("AttemptFrozen", "A submitted attempt is immutable. A correction is an attributed successor attempt.", 409);
  return row;
}
async function rehash(c: PoolClient, p: Principal, row: AttemptRow, set = "", values: unknown[] = []) {
  const at = (await c.query<AttemptRow>(`UPDATE ppo.inspection_attempts SET version=version+1,updated_at=clock_timestamp(),updated_by=$3${set ? `,${set}` : ""} WHERE workspace_id=$1 AND id=$2 RETURNING *`, [p.workspace_id, row.id, p.actor_id, ...values])).rows[0];
  const results = (await c.query<ResultRow>("SELECT * FROM ppo.inspection_results WHERE workspace_id=$1 AND attempt_id=$2", [p.workspace_id, row.id])).rows,
    uses = (await c.query<InstrumentUseRow>("SELECT attempt_id,instrument_id,snapshot FROM ppo.inspection_instrument_uses WHERE workspace_id=$1 AND attempt_id=$2", [p.workspace_id, row.id])).rows,
    evidence = (await c.query<EvidenceRow>("SELECT * FROM ppo.inspection_evidence WHERE workspace_id=$1 AND attempt_id=$2", [p.workspace_id, row.id])).rows;
  const hash = attemptHash({ ...at, occurred_at: at.occurred_at?.toISOString() ?? null }, results, uses, evidence);
  // Every write advances the version, the hash included; the version returned is the one the next command sends back.
  await c.query("UPDATE ppo.inspection_attempts SET content_hash=$3,version=version+1 WHERE workspace_id=$1 AND id=$2", [p.workspace_id, row.id, hash]);
  return { at: { ...at, version: at.version + 1, content_hash: hash }, results, uses, evidence };
}
export async function saveAttempt(c: PoolClient, p: Principal, host: Host, attemptId: string, expectedVersion: number, input: SaveInput) {
  const row = await lockDraft(c, p, host, attemptId, expectedVersion), allowed = new Set(row.check_keys);
  if (row.performer_id !== p.actor_id) throw new AppError(403, "Forbidden", `This attempt is being captured by ${(await c.query<{ display_name: string }>("SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2", [p.workspace_id, row.performer_id])).rows[0]?.display_name ?? "its performer"}.`);
  if (input.readings.some((r) => !allowed.has(r.check_key))) throw refuse("InvalidData", "A reading names a check that is not part of this attempt.");
  if (input.occurred_at && new Date(input.occurred_at).getTime() > Date.now() + 5 * 60_000) throw refuse("InvalidData", "The test time is in the future. Record when the test actually took place.");
  if (input.configuration_source_id && !(await c.query("SELECT 1 FROM ppo.material_sources WHERE workspace_id=$1 AND company_id=$2 AND id=$3 AND kind='InstalledConfiguration'", [p.workspace_id, row.company_id, input.configuration_source_id])).rowCount)
    throw refuse("InvalidData", "Choose an installed-configuration record retained for this package.");
  await c.query("DELETE FROM ppo.inspection_results WHERE workspace_id=$1 AND attempt_id=$2", [p.workspace_id, row.id]);
  for (const [i, r] of input.readings.entries())
    await c.query("INSERT INTO ppo.inspection_results(id,workspace_id,company_id,attempt_id,check_key,entry_state,raw_value,unit,choice,reason,note,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [randomUUID(), p.workspace_id, row.company_id, row.id, r.check_key, r.state, r.state === "Recorded" ? r.value : null, r.state === "Recorded" ? r.unit : null, r.state === "Recorded" ? r.choice : null, r.reason, r.note, i]);
  await c.query("DELETE FROM ppo.inspection_instrument_uses WHERE workspace_id=$1 AND attempt_id=$2", [p.workspace_id, row.id]);
  for (const id of new Set(input.instrument_ids)) {
    const found = (await c.query<InstrumentRow>(`SELECT ${instrumentColumns} FROM ppo.inspection_instruments WHERE workspace_id=$1 AND company_id=$2 AND id=$3`, [p.workspace_id, row.company_id, id])).rows[0];
    if (!found) throw refuse("InvalidData", "Choose an instrument from this company's calibration records.");
    const { id: _id, ...snapshot } = found; void _id;
    await c.query("INSERT INTO ppo.inspection_instrument_uses(workspace_id,company_id,attempt_id,instrument_id,snapshot) VALUES($1,$2,$3,$4,$5)", [p.workspace_id, row.company_id, row.id, id, JSON.stringify(snapshot)]);
  }
  return (await rehash(c, p, row, "configuration_reference=$4,configuration_source_id=$5,occurred_at=$6,timezone=$7,clock_concern=$8,prerequisites=$9,findings=$10",
    [input.configuration_reference, input.configuration_source_id, input.occurred_at, input.timezone ?? row.timezone, input.clock_concern, JSON.stringify(input.prerequisites), input.findings])).at;
}

// Evidence. Bytes are validated by the mechanisms the field runtime already uses: exact size and hash, and the
// same strict PNG inspection. Whatever cannot be validated is recorded as what it is, and blocks submission.
export type EvidenceInput =
  | { id: string; check_key: string | null; label: string; purpose: string; access_class: "Internal" | "CustomerSafe"; kind: "RetainedSource"; source_id: string }
  | { id: string; check_key: string | null; label: string; purpose: string; access_class: "Internal" | "CustomerSafe"; kind: "FieldEntry"; field_entry_id: string; field_entry_revision: number }
  | { id: string; check_key: string | null; label: string; purpose: string; access_class: "Internal" | "CustomerSafe"; kind: "StoredFile"; media_type: string; byte_count: number; sha256: string; content_base64: string | null };
export async function addEvidence(c: PoolClient, p: Principal, host: Host, attemptId: string, expectedVersion: number, e: EvidenceInput, operationId: string) {
  const row = await lockDraft(c, p, host, attemptId, expectedVersion);
  if (e.check_key && !row.check_keys.includes(e.check_key)) throw refuse("InvalidData", "This evidence names a check that is not part of this attempt.");
  let state: EvidenceState = "Complete", hash: string | null = null, media: string | null = null, bytes: number | null = null, storage: string | null = null;
  if (e.kind === "RetainedSource") {
    const s = (await c.query<{ content_hash: string | null; completeness: string }>("SELECT content_hash,completeness FROM ppo.material_sources WHERE workspace_id=$1 AND company_id=$2 AND id=$3 AND kind='TestEvidence'", [p.workspace_id, row.company_id, e.source_id])).rows[0];
    if (!s) throw refuse("InvalidData", "Choose test evidence retained for this package.");
    hash = s.content_hash; state = s.completeness === "Complete" && hash ? "Complete" : "Missing";
  } else if (e.kind === "FieldEntry") {
    // The original entry keeps its identity, revision and appointment. Only someone the field runtime lets read it may link it.
    const { entry } = await entryContext(c, p, e.field_entry_id).catch(() => { throw refuse("InvalidData", "That field entry does not exist, or you cannot read it."); });
    if (entry.version !== e.field_entry_revision) throw refuse("InvalidData", `That field entry is at revision ${entry.version}. Link the exact revision you inspected.`);
    if (entry.company_id !== row.company_id || (row.site_id && entry.site_id !== row.site_id)) throw refuse("InvalidData", "That field entry belongs to another company or site.");
    hash = sha256(entry.payload);
  } else {
    media = e.media_type; bytes = e.byte_count; hash = e.sha256; storage = e.id;
    if (!["image/png", "text/plain"].includes(e.media_type)) state = "Unsupported";
    else if (e.content_base64 === null) state = "Pending";
    else {
      const content = Buffer.from(e.content_base64, "base64");
      if (content.length !== e.byte_count || digest(content) !== e.sha256) throw refuse("EvidenceHashMismatch", "The uploaded bytes do not match the size and hash that were declared. Nothing was stored; upload the file again.");
      try { if (e.media_type === "image/png") inspectPng(content); else if (content.length > 65536 || content.includes(0)) throw Error("text"); } catch { state = "Unsupported"; }
      if (state === "Complete") await documentStore().store({ workspace_id: p.workspace_id, actor_id: p.actor_id, operation_id: e.id }, content, e.sha256);
    }
  }
  await c.query(`INSERT INTO ppo.inspection_evidence(id,workspace_id,company_id,attempt_id,check_key,kind,source_id,field_entry_id,field_entry_revision,storage_id,label,purpose,media_type,byte_count,content_hash,access_class,state,added_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [e.id, p.workspace_id, row.company_id, row.id, e.check_key, e.kind, e.kind === "RetainedSource" ? e.source_id : null, e.kind === "FieldEntry" ? e.field_entry_id : null, e.kind === "FieldEntry" ? e.field_entry_revision : null, storage,
      e.label, e.purpose, media, bytes, state === "Complete" || e.kind === "StoredFile" ? hash : null, e.access_class, state, p.actor_id]);
  void operationId;
  return { at: (await rehash(c, p, row)).at, state };
}
export async function removeEvidence(c: PoolClient, p: Principal, host: Host, attemptId: string, expectedVersion: number, evidenceId: string) {
  const row = await lockDraft(c, p, host, attemptId, expectedVersion);
  if (!(await c.query("DELETE FROM ppo.inspection_evidence WHERE workspace_id=$1 AND attempt_id=$2 AND id=$3", [p.workspace_id, row.id, evidenceId])).rowCount) throw unavailable();
  return (await rehash(c, p, row)).at;
}
// Exact stored bytes, re-verified against the recorded hash every time they are read.
export async function evidenceBytes(p: Principal, e: Pick<EvidenceRow, "storage_id" | "content_hash" | "byte_count">) {
  const bytes = await documentStore().read({ workspace_id: p.workspace_id, actor_id: p.actor_id, operation_id: e.storage_id! }, { provider: "Synthetic", tenant_id: null, site_id: null, drive_id: null, item_id: e.storage_id!, version_id: e.content_hash!, sha256: e.content_hash! });
  if (bytes.length !== e.byte_count || digest(bytes) !== e.content_hash) throw new AppError(503, "ExactDocumentUnavailable", "The exact evidence bytes are unavailable. Their reference is retained.");
  return Buffer.from(bytes);
}

// ---------------------------------------------------------------------------------------------
// Submission freezes the attempt, evaluates every entry under the current rule version, and lands each failed
// required check on its one unresolved defect. All of it commits together or none of it does.
export type DefectOwner = { owner_id: string; due: string; severity: "Unclassified" | "Minor" | "Major" | "Critical"; site_id: string | null; company_id: string; host_reference: string };
export async function submitAttempt(c: PoolClient, p: Principal, host: Host, attemptId: string, expectedVersion: number, operationId: string, today: string, owner: DefectOwner) {
  const row = await lockDraft(c, p, host, attemptId, expectedVersion);
  if (row.performer_id !== p.actor_id) throw new AppError(403, "Forbidden", "An attempt is submitted by the person who performed it.");
  const { results, uses, evidence } = await rehash(c, p, row), definitions = row.plan.filter((d) => row.check_keys.includes(d.key));
  const instruments = await Promise.all(uses.map(async (u) => {
    const live = (await c.query<InstrumentRow>(`SELECT ${instrumentColumns} FROM ppo.inspection_instruments WHERE workspace_id=$1 AND id=$2`, [p.workspace_id, u.instrument_id])).rows[0];
    return { reference: live.reference, ...(row.occurred_at ? assessInstrument(calibrationOf(live), localDate(row.occurred_at, row.timezone)) : { assessment: "Unknown" as const, reason: null }) };
  }));
  const stops = submissionBlockers(definitions, null, {
    readings: results.map((r) => toReading(r, evidence)), evidence: evidence.map((e) => ({ id: e.id, check_key: e.check_key, state: e.state, label: e.label })), prerequisites: row.prerequisites, instruments,
    occurred_at: row.occurred_at?.toISOString() ?? null, configuration_reference: row.configuration_reference,
  });
  // The draft stays exactly as it was saved. What blocks it is said precisely, so it can be fixed and submitted again.
  if (stops.length) throw blocked("SubmissionBlocked", stops);
  const failed: { definition: CheckDefinition; reason: string | null }[] = [];
  for (const r of results) {
    const d = definitions.find((x) => x.key === r.check_key)!, e = evaluate(d, toReading(r, evidence));
    await c.query("UPDATE ppo.inspection_results SET evaluation=$3,evaluation_reason=$4,compared=$5,rule_version=$6 WHERE workspace_id=$1 AND id=$2", [p.workspace_id, r.id, e.evaluation, e.reason, e.compared, ruleVersion]);
    if (e.evaluation === "Fail" && d.required) failed.push({ definition: d, reason: e.reason });
  }
  const submitted = (await c.query<AttemptRow>("UPDATE ppo.inspection_attempts SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Submitted',submitted_hash=content_hash,submitted_at=clock_timestamp(),submitted_by=$3,received_at=clock_timestamp(),submit_operation_id=$4 WHERE workspace_id=$1 AND id=$2 RETURNING *",
    [p.workspace_id, row.id, p.actor_id, operationId])).rows[0];
  const defects: { id: string; reference: string; created: boolean; check_key: string }[] = [];
  for (const f of failed) defects.push(await raiseDefect(c, p, submitted, f.definition, f.reason, owner));
  // A retest is tied to the open defects of the checks it covers, whether or not it passed.
  const open = (await c.query<{ id: string }>("SELECT id FROM ppo.inspection_defects WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3 AND state<>'Closed' AND check_key=ANY($4::text[])", [p.workspace_id, host.host_type, host.host_id, row.check_keys])).rows;
  for (const d of open) await c.query("INSERT INTO ppo.inspection_defect_attempts(workspace_id,company_id,defect_id,attempt_id,relation) VALUES($1,$2,$3,$4,'Retest') ON CONFLICT ON CONSTRAINT pk_inspection_defect_attempts DO NOTHING", [p.workspace_id, row.company_id, d.id, row.id]);
  void today;
  return { attempt: submitted, failed: failed.map((f) => f.definition.key), defects };
}
async function raiseDefect(c: PoolClient, p: Principal, a: AttemptRow, d: CheckDefinition, reason: string | null, owner: DefectOwner) {
  const existing = (await c.query<{ id: string; reference: string }>("SELECT id,reference FROM ppo.inspection_defects WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3 AND check_key=$4 AND state<>'Closed' FOR UPDATE", [p.workspace_id, a.host_type, a.host_id, d.key])).rows[0];
  if (existing) {
    // A repeated failure lands on the defect that is already open for this check. A correction that did not hold is open work again.
    await c.query("INSERT INTO ppo.inspection_defect_attempts(workspace_id,company_id,defect_id,attempt_id,relation) VALUES($1,$2,$3,$4,'Repeated') ON CONFLICT ON CONSTRAINT pk_inspection_defect_attempts DO NOTHING", [p.workspace_id, a.company_id, existing.id, a.id]);
    await c.query("UPDATE ppo.inspection_defects SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Open' WHERE workspace_id=$1 AND id=$2 AND state='CorrectionRecorded'", [p.workspace_id, existing.id, p.actor_id]);
    return { ...existing, created: false, check_key: d.key };
  }
  const id = randomUUID(), number = (await c.query<{ next: number }>("SELECT coalesce(max(defect_number),0)+1 AS next FROM ppo.inspection_defects WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3", [p.workspace_id, a.host_type, a.host_id])).rows[0].next,
    reference = `DEF-${String(number).padStart(3, "0")}`, title = `${d.name}: failed${reason ? ` (${reason.replace(/\.$/, "")})` : ""}`.slice(0, 200);
  const activity = await ownedAction(c, p, owner, `${owner.host_reference} · ${reference} · ${title}. Correct the cause and arrange a fresh retest; closing this action does not close the defect.`);
  await c.query(`INSERT INTO ppo.inspection_defects(id,workspace_id,company_id,host_type,host_id,created_by,updated_by,defect_number,reference,check_key,scope_key,title,severity,owner_id,due,source_attempt_id,activity_id)
    VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [id, p.workspace_id, a.company_id, a.host_type, a.host_id, p.actor_id, number, reference, d.key, d.scope_key, title, owner.severity, owner.owner_id, owner.due, a.id, activity]);
  await c.query("INSERT INTO ppo.inspection_defect_attempts(workspace_id,company_id,defect_id,attempt_id,relation) VALUES($1,$2,$3,$4,'Raised')", [p.workspace_id, a.company_id, id, a.id]);
  return { id, reference, created: true, check_key: d.key };
}
// One owned action in My Work for one defect, where both the person raising it and its owner may hold one.
// Where they may not, the defect stands on its own with its owner and date, and nothing pretends otherwise.
async function ownedAction(c: PoolClient, p: Principal, owner: DefectOwner, summary: string): Promise<string | null> {
  if (!owner.site_id) return null;
  const input: ActivityInput = { id: randomUUID(), company_id: owner.company_id, site_id: owner.site_id, kind: "TechnicalFollowUp", owner_id: owner.owner_id, summary: summary.slice(0, 2000), due_at: `${owner.due}T23:59:59.000Z`, due_needed: false, due_date_only: true, access_class: "Internal", links: [{ object_type: "Site", object_id: owner.site_id }] };
  try { await authoriseActivityInput(c, p, input); } catch (e) { if (e instanceof AppError && [403, 404, 422].includes(e.status)) return null; throw e; }
  await insertActivity(c, p, input);
  return input.id;
}

// ---------------------------------------------------------------------------------------------
export type ReviewInput = { id: string; decision: ReviewDecision | "ClarificationProvided"; reason: string; owner_id: string | null; due: string | null; policy: Record<string, unknown>; independence_required: boolean; applicability: unknown; operation_id: string };
export async function reviewAttempt(c: PoolClient, p: Principal, host: Host, attemptId: string, input: ReviewInput) {
  const row = (await c.query<AttemptRow>("SELECT * FROM ppo.inspection_attempts WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3 AND id=$4 FOR UPDATE", [p.workspace_id, host.host_type, host.host_id, attemptId])).rows[0];
  if (!row) throw unavailable();
  if (row.state !== "Submitted") throw refuse("NotSubmitted", "Only a submitted attempt is reviewed.", 409);
  const prior = (await c.query<{ decision: string; operation_id: string }>("SELECT decision,operation_id FROM ppo.inspection_reviews WHERE workspace_id=$1 AND attempt_id=$2 ORDER BY decided_at DESC,id DESC LIMIT 1", [p.workspace_id, row.id])).rows[0];
  if (prior && ["Accepted", "Returned"].includes(prior.decision)) throw refuse("AlreadyReviewed", `This attempt was already ${prior.decision.toLowerCase()} by operation ${prior.operation_id}. Recover that original outcome; later work is a successor attempt.`, 409);
  if (input.decision === "ClarificationProvided" ? prior?.decision !== "ClarificationRequired" : false) throw refuse("NoClarificationRequested", "No clarification is outstanding on this attempt.", 409);
  if (input.decision !== "ClarificationProvided" && input.independence_required && [row.performer_id, row.submitted_by, row.created_by].includes(p.actor_id))
    throw new AppError(403, "IndependenceRequired", "You captured or submitted this attempt, so you cannot review its evidence.");
  // Acceptance rests on the exact frozen content and on evidence that is still there to be read.
  if (input.decision === "Accepted") {
    const stale = (await c.query<{ label: string }>("SELECT label FROM ppo.inspection_evidence WHERE workspace_id=$1 AND attempt_id=$2 AND state<>'Complete'", [p.workspace_id, row.id])).rows;
    if (stale.length) throw blocked("EvidenceIncomplete", stale.map((e) => `${e.label}: this evidence is not complete.`));
  }
  await c.query("INSERT INTO ppo.inspection_reviews(id,workspace_id,company_id,attempt_id,decision,reason,submitted_hash,owner_id,due,policy,independence_required,applicability,operation_id,decided_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
    [input.id, p.workspace_id, row.company_id, row.id, input.decision, input.reason, row.submitted_hash, input.owner_id, input.due, JSON.stringify(input.policy), input.independence_required, JSON.stringify(input.applicability ?? null), input.operation_id, p.actor_id]);
  const closed: string[] = [];
  if (input.decision === "Accepted") {
    // Closes exactly the defects whose own check this attempt freshly passed. Every other obligation stays open.
    const passing = (await c.query<{ id: string; reference: string }>(`SELECT d.id,d.reference FROM ppo.inspection_defects d JOIN ppo.inspection_results r ON (r.workspace_id,r.attempt_id,r.check_key)=(d.workspace_id,$2::uuid,d.check_key)
      WHERE d.workspace_id=$1 AND d.host_type=$3 AND d.host_id=$4 AND d.state<>'Closed' AND d.source_attempt_id<>$2 AND r.evaluation='Pass'`, [p.workspace_id, row.id, row.host_type, row.host_id])).rows;
    for (const d of passing) {
      await c.query("UPDATE ppo.inspection_defects SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='Closed',closed_by_attempt_id=$4,closed_review_id=$5,closed_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2", [p.workspace_id, d.id, p.actor_id, row.id, input.id]);
      closed.push(d.reference);
    }
  }
  return { attempt: row, closed };
}
export type DefectUpdate = { owner_id: string; due: string; severity: DefectOwner["severity"]; proposed_correction: string | null; retest_required: boolean; changes_system: boolean; change_id: string | null };
export async function updateDefect(c: PoolClient, p: Principal, host: Host, defectId: string, expectedVersion: number, action: { kind: "coordinate"; update: DefectUpdate } | { kind: "correct"; note: string }) {
  const d = (await c.query<DefectRow>("SELECT * FROM ppo.inspection_defects WHERE workspace_id=$1 AND host_type=$2 AND host_id=$3 AND id=$4 FOR UPDATE", [p.workspace_id, host.host_type, host.host_id, defectId])).rows[0];
  if (!d) throw unavailable();
  if (d.version !== expectedVersion) throw new AppError(409, "VersionConflict", "This defect changed while you were working. Review the latest version before saving again.");
  if (d.state === "Closed") throw refuse("DefectClosed", "This defect is closed. A later failure is a new defect.", 409);
  if (action.kind === "correct")
    // Recording a correction closes nothing. The defect waits for a fresh retest and an accepted review of it.
    await c.query("UPDATE ppo.inspection_defects SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,state='CorrectionRecorded',correction_note=$4,correction_by=$3,correction_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2", [p.workspace_id, d.id, p.actor_id, action.note]);
  else {
    const u = action.update;
    if (u.changes_system && !u.change_id) throw refuse("ChangeReviewNeeded", "A correction that changes the actual system is linked to its engineering change (EN-07) before it is recorded here.");
    await c.query("UPDATE ppo.inspection_defects SET version=version+1,updated_at=clock_timestamp(),updated_by=$3,owner_id=$4,due=$5,severity=$6,proposed_correction=$7,retest_required=$8,changes_system=$9,change_id=$10 WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, d.id, p.actor_id, u.owner_id, u.due, u.severity, u.proposed_correction, u.retest_required, u.changes_system, u.change_id]);
  }
  return d;
}
