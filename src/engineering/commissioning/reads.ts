import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { choice, invalid, object, optionalId, uuid } from "../../shared/validation";
import { coverageComplete, criterionText, hasCriterion, inspectionLabel, isRequired } from "../../inspections/model";
import { evidenceBytes, instrumentColumns, localDate, type InstrumentRow } from "../../inspections/service";
import { listEngineering } from "../service";
import { candidateGates } from "./commands";
import { commissioningAccess, configurationLabel, dutyRefusal, loadRecords, loadSources, stamp, type Access, type LiveSource, type Loaded } from "./context";
import {
  applicabilityPresentation, basisPresentation, commissioningHref, commissioningRecordHref, csv, duePresentation, evaluationPresentation, label, obligationPresentation, obligationSatisfied, policyAllows, receivingPresentation, reconciliationPresentation,
  redlinePresentation, releasePresentation, reviewPresentation, sourcePresentation, workflowPresentation, workflows, type CommissioningViewId, type Presentation, type ReceivingState,
} from "./model";
import { packHtml, readBundle, recordHtml, releaseManifest, templateVersion, type HandoverManifest } from "./outputs";

const tag = (text: string, tone: Presentation["tone"], icon: Presentation["icon"]): Presentation => ({ label: text, tone, icon });
const pad = (n: number) => String(n).padStart(2, "0");

// ---------------------------------------------------------------------------------------------
async function frame(p: Principal, packageId: string) {
  const c = database(), access = await commissioningAccess(c, p, packageId), sources = await loadSources(c, p, access), records = await loadRecords(c, p, access, sources);
  const active = records.filter((l) => !l.row.archived_at);
  return {
    c, access, sources, records,
    shell: {
      package: { id: access.pkg.id, reference: access.pkg.display_number, title: access.pkg.title, context_kind: access.pkg.context_kind, context_title: access.pkg.context_title, context_reference: access.pkg.context_reference, customer_name: access.pkg.customer_name, site_name: access.site_name, site_timezone: access.site_timezone },
      can: access.can, internal: access.internal, policy: { configured: !!access.policy, version: access.policy?.policy_version ?? null },
      // Menu badges count this whole permitted Engineering package, never a filtered page, and never a remembered number.
      menu: { scope: "Package" as const, results: active.reduce((n, l) => n + l.facts.attempts_in_review, 0), releases: active.filter((l) => l.facts.release === "InReview" || l.facts.release === "ApprovedForIssue").length,
        handovers: active.reduce((n, l) => n + l.requests.filter((r) => ["Requested", "OutcomeUnknown", "Unavailable", "Returned", "ClarificationRequired"].includes(r.state)).length, 0) },
      // The calendar day at the site. A due date is late by the site's day, never by the server's or by UTC.
      synthetic: true as const, observed_at: new Date().toISOString(), today: localDate(new Date(), access.site_timezone),
    },
  };
}
type Frame = Awaited<ReturnType<typeof frame>>;

const latestAttempt = (l: Loaded) => [...l.attempts].reverse().find((a) => a.row.state === "Submitted") ?? null;
const serviceState = (l: Loaded): ReceivingState => (l.release?.state === "Issued" ? l.requests.find((r) => r.handover.release_id === l.release!.id && r.handover.destination === "Service")?.state ?? "NotRequested" : "NotRequested");
function row(l: Loaded) {
  const last = latestAttempt(l);
  return {
    id: l.row.id, version: l.row.version, reference: l.row.reference, title: l.row.title, system_name: l.row.system_name, area: l.row.area, workflow: l.workflow, workflow_view: workflowPresentation[l.workflow], coverage: l.coverage,
    evidence_view: l.evidence_view, as_built_view: l.as_built_view, next: l.next, owner_id: l.row.owner_id, owner_name: l.row.owner_name, due: l.row.due, due_meaning: l.row.due_meaning, archived: !!l.row.archived_at,
    // Optional columns. Each is read from its own retained record; none is a status of its own.
    basis: l.basis ? `${l.basis.reference} ${l.basis.revision}` : null, basis_view: basisPresentation[l.basis?.state ?? "None"], configuration: l.configuration ? configurationLabel(l.configuration) : null, last_test: stamp(last?.row.occurred_at ?? null),
    release_reference: l.release && l.release.state !== "Draft" ? `${l.release.reference} r${pad(l.release.revision_number)}` : null, service_view: receivingPresentation[serviceState(l)], source: l.condition.condition, updated_at: stamp(l.row.updated_at)!,
  };
}
type RegisterRow = ReturnType<typeof row>;

// What the inspector shows, in the order the plan gives it. Every label projects a retained record; a time beside
// a source check is that check's time, never the moment a panel opened.
function inspect(l: Loaded, access: Access) {
  const last = latestAttempt(l), check = l.checks[0] ?? null, failures = l.attempts.reduce((n, a) => n + (a.row.state === "Submitted" && a.results.some((r) => r.evaluation === "Fail") ? 1 : 0), 0),
    redline = l.redlines.filter((r) => r.state !== "Rejected").at(-1) ?? null, pending = l.redlines.filter((r) => r.state === "AcceptedForIncorporation"), drawing = l.bound.find((b) => b.role === "IntendedDrawing") ?? null,
    support = l.obligations.filter((o) => o.kind === "Manual" || o.kind === "BackupReference" || o.kind === "SupportContext"), training = l.obligations.filter((o) => o.kind === "Training"), service = serviceState(l),
    href = (view: CommissioningViewId, panel: string | null = null) => commissioningHref(view, { package: access.pkg.id, record: l.row.id, panel });
  const asBuilt = l.facts.release === "Issued" ? tag(l.facts.release_partial ? "Partial as-built released" : "As-built released", "positive", "tick-circle")
    : l.facts.redlines_to_incorporate || l.facts.redlines_review || l.facts.differences_open || l.facts.referred_open || l.facts.source === "ReassessmentRequired" ? tag("As-built pending", "caution", "alert")
    : l.facts.release === "InReview" || l.facts.release === "ApprovedForIssue" || l.facts.candidate_ready ? tag(l.as_built_view.label, "information", "clock") : tag("As-built not started", "neutral", "document");
  const worst = (items: typeof support) => (!items.length ? null : items.every((o) => obligationSatisfied(o.state)) ? (items.every((o) => o.state === "Complete") ? obligationPresentation.Complete : obligationPresentation[items.find((o) => o.state !== "Complete")!.state]) : obligationPresentation[items.find((o) => !obligationSatisfied(o.state))!.state]);
  return {
    ...row(l), context: { project: access.pkg.context_title, customer: access.pkg.customer_name, site: access.site_name },
    // Test acceptance and as-built issue are different facts, shown apart.
    tags: [coverageComplete(l.coverage) ? tag("Test evidence accepted", "positive", "tick") : l.evidence_view, asBuilt],
    basis_section: {
      procedure: l.basis ? { text: `${l.basis.reference} · ${l.basis.revision}`, view: basisPresentation[l.basis.state] } : null,
      tested_configuration: last?.row.configuration_reference ?? (l.configuration ? configurationLabel(l.configuration) : null),
      latest_attempt: last ? { number: pad(last.row.attempt_number), review: reviewPresentation[last.review], occurred_at: stamp(last.row.occurred_at), timezone: last.row.timezone } : null,
      // The result and time of the last recorded check. Where no check exists, nothing is claimed.
      source_check: check ? { result: check.result, view: sourcePresentation[check.result], checked_at: stamp(check.checked_at)!, checked_by: check.checked_by_name, adapter: check.adapter, now: l.condition.condition, now_view: sourcePresentation[l.condition.condition] } : null,
      source_now: { condition: l.condition.condition, view: sourcePresentation[l.condition.condition], reasons: l.condition.reasons }, failures_retained: failures, history_href: href("results", "attempts"),
    },
    design_section: {
      intended_drawing: drawing ? (drawing.live?.readable === false ? "Restricted source" : `${drawing.snapshot.reference} · Rev ${drawing.snapshot.revision}`) : null, installed_record: l.configuration ? `${l.configuration.installed_reference} · Rev ${l.configuration.installed_revision}` : null,
      reconciliation: reconciliationPresentation[l.facts.reconciliation], redline: redline ? { reference: redline.reference, view: redlinePresentation[redline.state], state_label: label(redline.state) } : null,
      outstanding: pending.length ? { title: `${pending.length} redline${pending.length === 1 ? "" : "s"} to incorporate`, text: pending[0].proposed_correction, owner_name: pending[0].owner_name, due: pending[0].due }
        : l.facts.differences_open + l.facts.referred_open ? { title: `${l.facts.differences_open + l.facts.referred_open} difference${l.facts.differences_open + l.facts.referred_open === 1 ? "" : "s"} open`, text: "Intended and observed installation are not reconciled.", owner_name: l.row.owner_name, due: l.row.due } : null,
    },
    handover_section: { manuals_backups: worst(support), training: worst(training), service: receivingPresentation[service], service_state: service },
    // Every blocker that stands between this package and its next stage, with whose it is: one action never implies the rest.
    blockers: [
      ...l.defects.filter((d) => d.state !== "Closed").map((d) => ({ text: `${d.reference}: ${d.title}`, owner_name: d.owner_name, due: d.due })), ...pending.map((r) => ({ text: `${r.reference}: ${r.proposed_correction}`, owner_name: r.owner_name, due: r.due })),
      ...l.obligations.filter((o) => !obligationSatisfied(o.state)).map((o) => ({ text: `${o.title} (${label(o.required_stage).toLowerCase()})`, owner_name: o.owner_name as string | null, due: o.due })),
    ].slice(0, 8),
    actions: { primary: { label: l.next.action, href: href(l.next.view, l.next.panel) }, record_href: commissioningRecordHref(l.row.id), history_href: href("handovers", "history") },
    archived_reason: l.row.archived_reason,
  };
}

const registerViews = ["all", "mine", "retests", "ready", "handover", "archived"] as const;
const sorts = ["due", "reference", "title", "area", "owner", "workflow", "updated"] as const;
export async function readRegister(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["view", "q", "workflow", "owner_id", "area", "blocker", "due", "sort", "dir", "page", "page_size", "record"]), view = choice(q.view ?? "all", "view", registerViews), text = q.q ?? "", page = Number(q.page ?? 1), size = Number(q.page_size ?? 25);
  if (typeof text !== "string" || text.length > 200) invalid("q", "Search up to 200 characters.");
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(size) || size < 1 || size > 100) invalid("page", "Use a page from 1 and a page size from 1 to 100.");
  const stage = q.workflow ? choice(q.workflow, "workflow", workflows) : null, owner = optionalId(q.owner_id || undefined, "owner_id"), area = typeof q.area === "string" && q.area ? q.area.slice(0, 120) : null, blocker = typeof q.blocker === "string" && q.blocker ? q.blocker.slice(0, 60) : null,
    due = q.due ? choice(q.due, "due", ["overdue", "needed"] as const) : null, sort = choice(q.sort ?? "due", "sort", sorts), dir = choice(q.dir ?? "asc", "dir", ["asc", "desc"] as const), selectedId = optionalId(q.record || undefined, "record");
  const f = await frame(p, packageId), needle = (text as string).trim().toLowerCase(), today = f.shell.today;
  // Saved presentations are filters over the same permitted records. They hold no list of their own and decide nothing.
  const inView = (l: Loaded, v: (typeof registerViews)[number]) => (v === "archived" ? !!l.row.archived_at : !l.row.archived_at && (v === "all" || (v === "mine" ? l.row.owner_id === p.actor_id || l.attempts.some((a) => a.row.performer_id === p.actor_id && a.row.state === "Draft") || l.requests.some((r) => r.handover.recipient_id === p.actor_id && r.state === "Requested")
    : v === "retests" ? l.facts.defects_open > 0 || l.facts.attempts_returned > 0 : v === "ready" ? l.facts.candidate_ready || l.facts.release === "ApprovedForIssue" : l.facts.release === "Issued" && serviceState(l) !== "Accepted")));
  const searchable = (l: Loaded) => [l.row.reference, l.row.title, l.row.system_name, l.row.area, f.access.pkg.context_title, f.access.site_name, l.basis?.reference, ...l.scope.items.flatMap((i) => [i.reference, i.title]), ...l.bound.filter((b) => b.live?.readable !== false).map((b) => b.snapshot.reference), ...l.releases.map((r) => r.reference), ...l.redlines.map((r) => r.reference)];
  const conditioned = f.records.filter((l) => (!stage || l.workflow === stage) && (!owner || l.row.owner_id === owner) && (!area || l.row.area === area) && (!blocker || l.next.code === blocker) && (!due || (due === "needed" ? !l.row.due : !!l.row.due && l.row.due < today && !l.row.archived_at))
    && (!needle || searchable(l).some((v) => v?.toLowerCase().includes(needle))));
  const rows = conditioned.filter((l) => inView(l, view)).map(row);
  // An unknown value sorts last in either direction: a missing date is never the earliest or the latest date.
  const key = (r: RegisterRow): string | null => ({ due: r.due, reference: r.reference, title: r.title.toLowerCase(), area: `${r.area} ${r.system_name}`.toLowerCase(), owner: r.owner_name?.toLowerCase() ?? null, workflow: String(workflows.indexOf(r.workflow)).padStart(2, "0"), updated: r.updated_at })[sort];
  rows.sort((a, b) => { const x = key(a), y = key(b); return x === y ? a.reference.localeCompare(b.reference) : x === null ? 1 : y === null ? -1 : (x < y ? -1 : 1) * (dir === "asc" ? 1 : -1); });
  const selected = selectedId ? f.records.find((l) => l.row.id === selectedId) : undefined;
  return {
    ...f.shell, criteria: { view, q: needle, workflow: stage, owner_id: owner, area, blocker, due, sort, dir },
    // Whole-scope counts and filtered results are different numbers and are labelled as such. Neither changes what may be released.
    counts: { scope: "Package" as const, conditioned: needle !== "" || !!(stage || owner || area || blocker || due), views: Object.fromEntries(registerViews.map((v) => [v, conditioned.filter((l) => inView(l, v)).length])), package_total: f.records.length },
    items: rows.slice((page - 1) * size, page * size), total: rows.length, page, page_size: size,
    // A selection that is missing or outside this package is reported as such. The last permitted record is never left on screen under another address.
    selected: selected ? inspect(selected, f.access) : null, selection: selectedId ? (selected ? "Found" as const : "Unavailable" as const) : "None" as const,
    options: { areas: [...new Set(f.records.map((l) => l.row.area))].sort(), owners: [...new Map(f.records.filter((l) => l.row.owner_id).map((l) => [l.row.owner_id!, l.row.owner_name!]))].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
      blockers: [...new Map(f.records.map((l) => [l.next.code, l.next.label]))].map(([code, text]) => ({ code, label: text })) },
    completeness: "Complete" as const,
  };
}

// ---------------------------------------------------------------------------------------------
const sourceView = (s: LiveSource) => (s.readable
  ? { id: s.id, kind: s.kind, reference: s.reference, title: s.title, revision: s.revision, file_version: s.file_version, content_hash: s.content_hash, observed_at: s.observed_at, use: s.use, successor_id: s.successor_id, restricted: s.restricted, readable: true as const, adapter: s.adapter, change_reason: s.change_reason, changed_at: s.changed_at }
  // Nothing of a restricted source is disclosed: no title, reference, revision or hash. Only that one exists, and its kind.
  : { id: s.id, kind: s.kind, reference: "Restricted source", title: "Restricted for this identity", revision: "", file_version: "", content_hash: null, observed_at: s.observed_at, use: s.use, successor_id: null, restricted: true, readable: false as const, adapter: s.adapter, change_reason: null, changed_at: null });
const withheld = "Withheld for this identity";
function detail(f: Frame, p: Principal, l: Loaded) {
  const { access } = f, inside = access.internal, mine = (id: string | null) => id === p.actor_id, today = f.shell.today, policy = access.policy;
  const role = (r: Parameters<typeof policyAllows>[2], scope = {}) => policyAllows(policy, p.actor_id, r, scope), release = l.release;
  const gates = release ? candidateGates(l, access, release.state === "ApprovedForIssue" || release.state === "Issued" ? release.approved_by ?? p.actor_id : p.actor_id, release) : [];
  const draft = l.attempts.find((a) => a.row.state === "Draft") ?? null, basisInReview = l.bases.find((b) => b.state === "InReview") ?? null, basisDraft = l.bases.find((b) => b.state === "Draft") ?? null;
  return {
    inspector: inspect(l, access),
    record: { id: l.row.id, version: l.row.version, reference: l.row.reference, title: l.row.title, system_name: l.row.system_name, area: l.row.area, owner_id: l.row.owner_id, owner_name: l.row.owner_name, due: l.row.due, due_meaning: l.row.due_meaning, release_stage: l.row.release_stage,
      due_view: duePresentation(l.row.due, today, !l.row.archived_at), created_at: stamp(l.row.created_at), archived_at: stamp(l.row.archived_at), archived_reason: l.row.archived_reason, workflow: l.workflow, workflow_view: workflowPresentation[l.workflow] },
    scope: { id: l.scope.id, version: l.scope.version, number: l.scope.scope_number, state: l.scope.state, statement: l.scope.statement, items: l.scope.items, interfaces: l.scope.interfaces, frozen_at: stamp(l.scope.frozen_at), versions: l.scopes.map((s) => ({ id: s.id, number: s.scope_number, state: s.state })), editable: l.scope.state === "Working" && access.can.edit && !l.row.archived_at },
    bases: l.bases.map((b) => ({
      id: b.id, version: b.version, number: b.basis_number, reference: b.reference, revision: b.revision, state: b.state, state_view: basisPresentation[b.state], approval_purpose: b.approval_purpose, procedure_source_id: b.procedure_source_id, drawing_source_id: b.drawing_source_id, configuration_source_id: b.configuration_source_id,
      sources: Object.values(b.sources).map((s) => { const live = f.sources.find((x) => x.id === s.source_id); return live && !live.readable ? { source_id: s.source_id, kind: s.kind, reference: "Restricted source", revision: "", file_version: "", content_hash: null, observed_at: s.observed_at } : s; }),
      checks: b.checks.map((k) => ({ ...k, criterion_text: criterionText(k), has_criterion: hasCriterion(k), is_required: isRequired(k) })), prerequisites: b.prerequisites, content_hash: b.content_hash, submitted_hash: b.submitted_hash, submitted_at: stamp(b.submitted_at), submitted_by_name: b.submitted_by_name,
      decision_reason: inside ? b.decision_reason : b.decision_reason ? withheld : null, decided_by_name: b.decided_by_name, decided_at: stamp(b.decided_at), policy_version: b.policy_version, independence_required: b.independence_required, return_owner_name: b.return_owner_name, return_due: b.return_due, created_by_name: b.created_by_name,
      editable: b.state === "Draft" && access.can.edit && !l.row.archived_at, current: b.id === l.basis?.id,
      // A row version, a procedure revision and an Engineering issue revision are three identifiers. All three are shown.
      identifiers: { row_version: b.version, procedure_revision: b.revision, issue_revisions: Object.values(b.sources).map((s) => `${s.reference} Rev ${s.revision} (file ${s.file_version})`) },
    })),
    source_condition: { ...l.condition, view: sourcePresentation[l.condition.condition], bound: l.bound.map((b) => ({ role: b.role, snapshot: b.live?.readable === false ? null : b.snapshot, live: b.live ? sourceView(b.live) : null })) },
    checks_recorded: l.checks.slice(0, 12).map((k) => ({ id: k.id, result: k.result, view: sourcePresentation[k.result], checked_at: stamp(k.checked_at)!, checked_by_name: k.checked_by_name, adapter: k.adapter, assessment_evidence: k.assessment_evidence })),
    coverage: l.coverage, definitions: l.definitions.map((d) => {
      const e = l.effective.find((x) => x.check_key === d.key);
      return { key: d.key, name: d.name, scope_key: d.scope_key, scope_title: d.scope_key ? l.scope.items.find((i) => i.key === d.scope_key)?.title ?? d.scope_key : "Whole scope", criterion_text: criterionText(d), has_criterion: hasCriterion(d), is_required: isRequired(d), check_type: d.check_type,
        unit: d.numeric?.unit ?? null, precision: d.numeric?.precision ?? null, choices: d.qualitative?.choices ?? [], condition: d.condition, evidence_min: d.evidence_min, instrument_required: d.instrument_required, witness: d.witness,
        evaluation: e?.evaluation ?? null, evaluation_view: e ? evaluationPresentation[e.evaluation] : evaluationPresentation.NotTested, review_view: e ? reviewPresentation[e.review] : null, applicability_view: e ? applicabilityPresentation[e.applicability] : null, attempt_number: e?.attempt_number ?? null };
    }),
    attempts: l.attempts.map((a) => ({
      id: a.row.id, version: a.row.version, number: pad(a.row.attempt_number), state: a.row.state, predecessor_id: a.row.predecessor_id, predecessor_number: a.row.predecessor_id ? pad(l.attempts.find((x) => x.row.id === a.row.predecessor_id)?.row.attempt_number ?? 0) : null, plan_source: a.row.plan_source, scope_keys: a.row.scope_keys, check_keys: a.row.check_keys,
      configuration_reference: a.row.configuration_reference, configuration_source_id: a.row.configuration_source_id, performer_id: a.row.performer_id, performer_name: inside ? a.row.performer_name : "Assigned performer", occurred_at: stamp(a.row.occurred_at), timezone: a.row.timezone, received_at: stamp(a.row.received_at),
      clock_concern: a.row.clock_concern, prerequisites: a.row.prerequisites, findings: inside ? a.row.findings : a.row.findings ? withheld : null, content_hash: a.row.content_hash, submitted_hash: a.row.submitted_hash, submitted_at: stamp(a.row.submitted_at), review: a.review, review_view: reviewPresentation[a.review],
      results: a.results.map((r) => ({ check_key: r.check_key, name: a.row.plan.find((d) => d.key === r.check_key)?.name ?? r.check_key, state: r.entry_state, value: r.raw_value, unit: r.unit, choice: r.choice, reason: r.reason, note: inside ? r.note : null, evaluation: r.evaluation, evaluation_view: r.evaluation ? evaluationPresentation[r.evaluation] : null, evaluation_reason: r.evaluation_reason, compared: r.compared, rule_version: r.rule_version })),
      instruments: a.instruments.map((i) => ({ instrument_id: i.instrument_id, reference: i.snapshot.reference, description: i.snapshot.description, calibration_reference: i.snapshot.calibration_reference, valid_from: i.snapshot.valid_from, valid_to: i.snapshot.valid_to, assessment: i.assessment, assessment_label: inspectionLabel(i.assessment), reason: i.reason, expired_today: i.expired_today })),
      evidence: inside ? a.evidence.map((e) => ({ id: e.id, check_key: e.check_key, kind: e.kind, label: e.label, purpose: e.purpose, media_type: e.media_type, byte_count: e.byte_count, content_hash: e.content_hash, access_class: e.access_class, state: e.state, added_by_name: e.added_by_name, added_at: stamp(e.added_at), downloadable: e.kind === "StoredFile" && e.state === "Complete" })) : [],
      evidence_count: a.evidence.length,
      reviews: a.reviews.map((v) => ({ id: v.id, decision: v.decision, decision_label: inspectionLabel(v.decision), reason: inside ? v.reason : withheld, decided_by_name: inside ? v.decided_by_name : "Reviewer", decided_at: stamp(v.decided_at)!, owner_name: v.owner_name, due: v.due, operation_id: v.operation_id })),
      defects: a.defects.map((d) => ({ ...d, reference: l.defects.find((x) => x.id === d.defect_id)?.reference ?? "" })), mine: mine(a.row.performer_id), editable: a.row.state === "Draft" && mine(a.row.performer_id) && access.can.capture,
    })),
    draft_attempt_id: draft?.row.id ?? null,
    defects: l.defects.map((d) => ({ id: d.id, version: d.version, reference: d.reference, check_key: d.check_key, check_name: l.definitions.find((k) => k.key === d.check_key)?.name ?? d.check_key, scope_key: d.scope_key, title: d.title, severity: d.severity, state: d.state, state_view: d.state === "Closed" ? tag("Closed", "positive", "tick") : d.state === "CorrectionRecorded" ? tag("Correction recorded", "information", "clock") : tag("Open", "failure", "error"),
      owner_id: d.owner_id, owner_name: d.owner_name, due: d.due, retest_required: d.retest_required, proposed_correction: d.proposed_correction, correction_note: inside ? d.correction_note : null, correction_by_name: d.correction_by_name, correction_at: stamp(d.correction_at), changes_system: d.changes_system, change_id: d.change_id,
      closed_at: stamp(d.closed_at), attempts: l.attempts.flatMap((a) => a.defects.filter((x) => x.defect_id === d.id).map((x) => ({ number: pad(a.row.attempt_number), relation: x.relation, attempt_id: a.row.id }))),
      // The same action My Work shows, read where it lives. It is never a copy kept here.
      activity: d.activity ? { status: d.activity.status, owner_name: d.activity.owner_name, due_at: stamp(d.activity.due_at ? new Date(d.activity.due_at) : null), outcome: d.activity.outcome } : null, activity_id: d.activity_id })),
    configuration: l.configuration ? { id: l.configuration.id, version: l.configuration.version, number: l.configuration.snapshot_number, state: l.configuration.state, label: configurationLabel(l.configuration), installed_reference: l.configuration.installed_reference, installed_revision: l.configuration.installed_revision,
      intended_source_id: l.configuration.intended_source_id, installed_source_id: l.configuration.installed_source_id, submitted_by_name: l.configuration.submitted_by_name, submitted_at: stamp(l.configuration.submitted_at), reconciled_by_name: l.configuration.reconciled_by_name, reconciled_at: stamp(l.configuration.reconciled_at),
      reconcile_reason: inside ? l.configuration.reconcile_reason : null, content_hash: l.configuration.content_hash, view: reconciliationPresentation[l.facts.reconciliation], open: l.configuration.state !== "Reconciled" } : null,
    configurations: l.configurations.map((k) => ({ id: k.id, number: k.snapshot_number, state: k.state, label: configurationLabel(k) })),
    differences: l.differences.map((d) => ({ id: d.id, version: d.version, item_key: d.item_key, kind: d.kind, component: d.component, scope_key: d.scope_key, critical: d.critical, intended_value: d.intended_value, intended_source: d.intended_source, observed_value: d.observed_value, observed_evidence: d.observed_evidence,
      observation_verified: d.observation_verified, observed_by_name: d.observed_by_name, observed_at: stamp(d.observed_at), proposed_as_built: d.proposed_as_built, disposition: d.disposition, disposition_label: label(d.disposition), disposition_reason: d.disposition_reason, disposition_by_name: d.disposition_by_name, disposition_at: stamp(d.disposition_at),
      disposition_view: d.disposition === "Open" ? tag("Open", "caution", "alert") : d.disposition === "ReferredToChange" ? tag("With change review", "caution", "alert") : d.disposition === "RejectedCorrectionRequired" ? tag("Correction required", "failure", "error") : tag(label(d.disposition), "positive", "tick"), change_id: d.change_id, change: d.change, redline_id: d.redline_id })),
    redlines: l.redlines.map((r) => ({ id: r.id, version: r.version, reference: r.reference, source_id: r.source_id, source: `${r.source_snapshot.reference} · Rev ${r.source_snapshot.revision}`, location: r.location, component: r.component, description: r.description, evidence: r.evidence, proposed_correction: r.proposed_correction, classification: r.classification,
      state: r.state, state_view: redlinePresentation[r.state], state_label: label(r.state), author_id: r.author_id, author_name: r.author_name, recorded_at: stamp(r.recorded_at)!, owner_name: r.owner_name, due: r.due, decision_reason: r.decision_reason, decided_by_name: r.decided_by_name, decided_at: stamp(r.decided_at), change_id: r.change_id, change: r.change,
      predecessor_id: r.predecessor_id, successor_source_id: r.successor_source_id, verification_note: r.verification_note, verified_by_name: r.verified_by_name, verified_at: stamp(r.verified_at), mine: mine(r.author_id) })),
    associations: l.all_associations.map((a) => ({ id: a.id, version: a.version, kind: a.kind, kind_label: label(a.kind), from_reference: a.from_reference, to_reference: a.to_reference, source: a.source, confirmation_method: a.confirmation_method, effective_from: stamp(a.effective_from)!, state: a.state,
      state_view: a.state === "Confirmed" ? tag("Confirmed", "positive", "tick") : a.state === "ReviewRequired" ? tag("Review required", "caution", "alert") : a.state === "Superseded" ? tag("Superseded", "neutral", "document") : tag("Proposed", "neutral", "target"), concern: a.concern, constraint_source: a.constraint_source, affected_checks: a.affected_checks,
      predecessor_id: a.predecessor_id, reviewer_name: a.reviewer_name, reviewed_at: stamp(a.reviewed_at), review_note: a.review_note, created_by_name: a.created_by_name, mine: mine(a.created_by) })),
    backups: l.backups.map((k) => ({ id: k.id, version: k.version, asset_reference: k.asset_reference, purpose: k.purpose, configuration_version: k.configuration_version, native_format: k.native_format, stored_reference: inside ? k.stored_reference : "Restricted reference", content_hash: inside ? k.content_hash : null, captured_at: stamp(k.captured_at)!,
      author_name: k.author_name, access_class: k.access_class, compatibility: k.compatibility, required_stage: k.required_stage,
      // Three facts, three pieces of evidence. None is inferred from another.
      facts: [{ key: "available" as const, label: "Backup available", at: stamp(k.available_at), by: k.available_by_name, evidence: k.available_evidence }, { key: "identity" as const, label: "Backup identity verified", at: stamp(k.identity_at), by: k.identity_by_name, evidence: k.identity_evidence }, { key: "restore" as const, label: "Restore verified", at: stamp(k.restore_at), by: k.restore_by_name, evidence: k.restore_evidence }] })),
    obligations: l.obligations.map((o) => ({ ...o, state_view: obligationPresentation[o.state], stage_label: label(o.required_stage), kind_label: label(o.kind), satisfied: obligationSatisfied(o.state), due_view: duePresentation(o.due, today, !obligationSatisfied(o.state)) })),
    releases: l.releases.map((r) => ({ id: r.id, version: r.version, reference: r.reference, revision: r.revision_number, number: r.release_number, predecessor_id: r.predecessor_id, successor_id: r.successor_id, state: r.state, state_view: releasePresentation[r.state], partial: r.partial, included: r.included, excluded: r.excluded, audience: r.audience, recipients: r.recipients,
      manifest_hash: r.manifest_hash, submitted_hash: r.submitted_hash, created_by_name: r.created_by_name, submitted_by_name: r.submitted_by_name, submitted_at: stamp(r.submitted_at), approved_by_name: r.approved_by_name, approved_at: stamp(r.approved_at), approval_reason: inside ? r.approval_reason : null, policy_version: r.policy_version,
      return_reason: r.return_reason, returned_by_name: r.returned_by_name, returned_at: stamp(r.returned_at), issued_by_name: r.issued_by_name, issued_at: stamp(r.issued_at), issue_operation_id: r.issue_operation_id, withdrawn_by_name: r.withdrawn_by_name, withdrawn_at: stamp(r.withdrawn_at), withdrawn_reason: r.withdrawn_reason, current: r.id === release?.id,
      kind_label: r.partial ? "Partial technical release" : "Technical release", editable: r.state === "Draft" && access.can.edit && !l.row.archived_at })),
    gates, outputs: l.outputs.map((o) => ({ id: o.id, release_id: o.release_id, handover_id: o.handover_id, kind: o.kind, audience: o.audience, template_version: o.template_version, manifest_hash: o.manifest_hash, html_sha256: o.html_sha256, pdf_sha256: o.pdf_sha256, pdf_bytes: o.pdf_bytes, state: o.state,
      state_view: o.state === "Issued" ? tag("Issued", "positive", "tick-circle") : o.state === "Prepared" ? tag("Prepared", "information", "clock") : tag("Discarded", "neutral", "document"), prepared_by_name: o.prepared_by_name, prepared_at: stamp(o.prepared_at)!, issued_at: stamp(o.issued_at) })),
    requests: l.requests.map((r) => {
      const party = inside || mine(r.handover.recipient_id);
      return { id: r.handover.id, version: r.handover.version, release_id: r.handover.release_id, destination: r.handover.destination, destination_label: label(r.handover.destination), recipient_id: r.handover.recipient_id, recipient_name: r.handover.recipient_name, purpose: r.handover.purpose, support_owner_name: r.handover.support_owner_name,
        due: r.handover.due, adapter: r.handover.adapter, state: r.state, state_view: receivingPresentation[r.state], created_by_name: r.handover.created_by_name, created_at: stamp(r.handover.created_at)!, created_operation_id: r.handover.created_operation_id, latest_submission_id: r.last?.id ?? null, latest_submission_version: r.last?.version ?? null,
        // The exact manifest is for the people who prepared it and the receiver it names. Everyone else in scope sees its state and hash.
        submissions: r.submissions.map((s) => ({ id: s.id, version: s.version, number: s.submission_number, manifest: party ? (s.manifest as HandoverManifest) : null, manifest_hash: s.manifest_hash, output_id: party ? s.output_id : null, correction_note: s.correction_note, submitted_by_name: s.submitted_by_name, submitted_at: stamp(s.submitted_at)!, operation_id: s.operation_id,
          delivery: s.delivery, delivery_checked_at: stamp(s.delivery_checked_at), outcome: s.outcome, outcome_label: s.outcome ? label(s.outcome) : null, outcome_reason: s.outcome_reason, outcome_by_name: s.outcome_by_name, outcome_at: stamp(s.outcome_at), outcome_operation_id: s.outcome_operation_id, return_owner_name: s.return_owner_name, return_due: s.return_due })),
        decide_refusal: !access.can.receive ? dutyRefusal("receive") : !mine(r.handover.recipient_id) ? `This request is addressed to ${r.handover.recipient_name}.` : role("Receiver", { destination: r.handover.destination }) };
    }),
    // Reasons travel with the record, so a positive action that cannot be taken always has its explanation beside it.
    refusals: {
      edit: access.can.edit ? null : dutyRefusal("edit"), capture: !access.can.capture ? dutyRefusal("capture") : role("Performer"),
      approve_basis: !access.can.review ? dutyRefusal("review") : role("BasisApprover") ?? (basisInReview && policy?.independence.basis && [basisInReview.submitted_by, basisInReview.created_by].includes(p.actor_id) ? "You prepared or submitted this test basis, so you cannot decide it." : null),
      review_evidence: !access.can.review ? dutyRefusal("review") : role("EvidenceReviewer"), reconcile: !access.can.review ? dutyRefusal("review") : role("AsBuiltApprover") ?? (l.configuration && policy?.independence.as_built && [l.configuration.submitted_by, l.configuration.created_by].includes(p.actor_id) ? "You prepared or submitted this comparison, so you cannot reconcile it." : null),
      approve_release: !access.can.review ? dutyRefusal("review") : role("AsBuiltApprover") ?? (release && policy?.independence.as_built && [release.submitted_by, release.created_by].includes(p.actor_id) ? "You prepared or submitted this candidate, so you cannot approve it." : null),
      issue: !access.can.issue ? dutyRefusal("issue") : role("Issuer"), assess_source: !access.can.source ? dutyRefusal("source") : role("SourceAssessor"),
      open_attempt: !access.can.capture ? dutyRefusal("capture") : role("Performer") ?? (!l.approved_basis ? "No test basis is approved for test." : draft ? `Attempt ${pad(draft.row.attempt_number)} is still a draft.` : l.condition.condition !== "Current" ? `${sourcePresentation[l.condition.condition].label}: readiness is rechecked before every attempt.` : null),
    },
    basis_draft_id: basisDraft?.id ?? null, basis_in_review_id: basisInReview?.id ?? null,
  };
}
export type RecordDetail = ReturnType<typeof detail>;

// The package queue of each focused destination: the whole permitted Engineering package for that destination, never a page of it.
function queue(records: Loaded[], view: "basis" | "results" | "configuration" | "releases" | "handovers", actor: string) {
  const active = records.filter((l) => !l.row.archived_at);
  if (view === "basis") return active.map((l) => ({ ...row(l), key: l.row.id, cells: [l.basis ? `${l.basis.reference} ${l.basis.revision}` : "No test basis", `${l.required_checks} required check${l.required_checks === 1 ? "" : "s"}`, l.coverage.criteria_missing ? `${l.coverage.criteria_missing} criteria missing` : l.basis ? "Criteria defined" : "—"], state_view: basisPresentation[l.basis?.state ?? "None"], attention: l.coverage.criteria_missing > 0 }));
  if (view === "results") return active.map((l) => ({ ...row(l), key: l.row.id, cells: [`${l.coverage.accepted} accepted of ${l.coverage.required} required`, `${l.coverage.failed} failed · ${l.coverage.not_tested} not tested · ${l.coverage.unassessable} unassessable`, `${l.defects.filter((d) => d.state !== "Closed").length} open defect${l.defects.filter((d) => d.state !== "Closed").length === 1 ? "" : "s"}`], state_view: l.evidence_view, attention: l.attempts.some((a) => a.review === "InReview") }));
  if (view === "configuration") return active.map((l) => ({ ...row(l), key: l.row.id, cells: [l.configuration ? configurationLabel(l.configuration) : "No installed record", `${l.facts.differences_open + l.facts.referred_open} open difference${l.facts.differences_open + l.facts.referred_open === 1 ? "" : "s"}`, `${l.facts.redlines_review + l.facts.redlines_to_incorporate} redline${l.facts.redlines_review + l.facts.redlines_to_incorporate === 1 ? "" : "s"} outstanding`], state_view: reconciliationPresentation[l.facts.reconciliation], attention: l.facts.associations_review > 0 }));
  if (view === "releases") return active.map((l) => ({ ...row(l), key: l.row.id, cells: [l.release ? `${l.release.reference} r${pad(l.release.revision_number)}` : "No candidate", l.release ? (l.release.partial ? "Partial technical release" : "Whole declared scope") : label(l.row.release_stage), l.release?.issued_at ? `Issued ${stamp(l.release.issued_at)!.slice(0, 10)}` : "Not issued"], state_view: l.as_built_view, attention: l.facts.release === "InReview" }));
  return active.map((l) => ({ ...row(l), key: l.row.id, cells: [l.release?.state === "Issued" ? `${l.release.reference} r${pad(l.release.revision_number)}` : "No issued release", `${l.obligations.filter((o) => !obligationSatisfied(o.state)).length} obligation${l.obligations.filter((o) => !obligationSatisfied(o.state)).length === 1 ? "" : "s"} open`, l.requests.length ? l.requests.map((r) => `${r.handover.destination}: ${receivingPresentation[r.state].label}`).join(" · ") : "No receiving request"],
    state_view: receivingPresentation[serviceState(l)], attention: l.requests.some((r) => r.handover.recipient_id === actor && r.state === "Requested") }));
}
export type QueueRow = ReturnType<typeof queue>[number];
export async function readView(p: Principal, packageId: string, query: unknown, view: "basis" | "results" | "configuration" | "releases" | "handovers") {
  const q = object(query, ["record"]), f = await frame(p, packageId), selectedId = optionalId(q.record || undefined, "record"), selected = selectedId ? f.records.find((l) => l.row.id === selectedId) : undefined;
  return { ...f.shell, view, queue: queue(f.records, view, p.actor_id), selected: selected ? detail(f, p, selected) : null, selection: selectedId ? (selected ? "Found" as const : "Unavailable" as const) : "None" as const };
}
// The full record route knows only the commissioning package. Its Engineering package is resolved here, through the same access check.
export async function readRecord(p: Principal, recordId: string, query: unknown) {
  object(query, []);
  const owner = (await database().query<{ package_id: string }>("SELECT package_id FROM ppo.commissioning_packages WHERE workspace_id=$1 AND id=$2", [p.workspace_id, uuid(recordId, "id")])).rows[0];
  if (!owner) throw unavailable();
  const f = await frame(p, owner.package_id), l = f.records.find((x) => x.row.id === recordId);
  if (!l) throw unavailable();
  return { ...f.shell, selected: detail(f, p, l) };
}

// Form choices: the people, sources, instruments, assets and engineering changes this identity may name for this package.
export async function readOptions(p: Principal, packageId: string, query: unknown) {
  object(query, []);
  const c = database(), access = await commissioningAccess(c, p, packageId), sources = await loadSources(c, p, access);
  const people = (await c.query<{ id: string; display_name: string; capabilities: string[] }>(
    `SELECT u.id,u.display_name,array_agg(DISTINCT g.capability ORDER BY g.capability) AS capabilities FROM ppo.users u JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(u.workspace_id,u.id)
     WHERE u.workspace_id=$1 AND u.active AND g.capability LIKE 'engineering.%' AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
     AND (g.scope_type='Workspace' OR (g.company_id=$2 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$3::uuid))))
     GROUP BY u.id,u.display_name HAVING 'engineering.read'=ANY(array_agg(g.capability)) ORDER BY u.display_name,u.id LIMIT 100`, [p.workspace_id, access.pkg.company_id, access.pkg.site_id])).rows;
  const roles = (id: string) => access.policy?.grants.filter((g) => g.actor_id === id) ?? [];
  const instruments = access.internal ? (await c.query<InstrumentRow>(`SELECT ${instrumentColumns} FROM ppo.inspection_instruments WHERE workspace_id=$1 AND company_id=$2 ORDER BY reference`, [p.workspace_id, access.pkg.company_id])).rows : [];
  const assets = access.pkg.site_id ? (await c.query<{ id: string; display_number: string; description: string; identity_status: string }>("SELECT id,display_number,description,identity_status FROM ppo.assets WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND lifecycle_status='Active' ORDER BY display_number LIMIT 100", [p.workspace_id, access.pkg.company_id, access.pkg.site_id])).rows : [];
  const changes = (await c.query<{ id: string; reference: string; title: string; stage: string }>("SELECT id,reference,title,stage FROM ppo.engineering_changes WHERE workspace_id=$1 AND package_id=$2 ORDER BY change_number", [p.workspace_id, access.pkg.id])).rows;
  return {
    people: people.map((u) => ({ id: u.id, name: u.display_name, preparer: u.capabilities.includes("engineering.edit"), receiver_for: u.capabilities.includes("engineering.commissioning.receive") ? roles(u.id).filter((g) => g.role === "Receiver").flatMap((g) => g.destinations) : [] })),
    sources: sources.map(sourceView), instruments, assets, changes, changes_href: `/engineering/${access.pkg.id}/changes`, policy_configured: !!access.policy, site_timezone: access.site_timezone,
    limits: ["Sources are the retained snapshots of the local synthetic upstream adapter. Publishing a successor drawing or procedure is its owner's act, made there and never here.", "Instruments and calibration records are fictional fixtures.", "An empty list is not evidence that nothing exists."],
  };
}

export async function readHistory(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["record", "subject", "limit"]), f = await frame(p, packageId), recordId = optionalId(q.record || undefined, "record"), limit = Number(q.limit ?? 100),
    subjects = ["Package", "Scope", "Basis", "Attempt", "Review", "Defect", "Configuration", "Difference", "Redline", "Association", "Backup", "Obligation", "Release", "Output", "Handover", "Submission", "SourceCheck"] as const, subject = q.subject ? choice(q.subject, "subject", subjects) : null;
  if (!Number.isInteger(limit) || limit < 1 || limit > 300) invalid("limit", "Show 1 to 300 events.");
  const selected = recordId ? f.records.find((l) => l.row.id === recordId) : undefined;
  const events = (await f.c.query<{ id: string; commissioning_id: string; subject_type: string; subject_id: string; record_version: number; event_type: string; reason: string; note: string | null; created_at: Date; operation_id: string; actor_name: string }>(
    `SELECT e.id,e.commissioning_id,e.subject_type,e.subject_id,e.record_version,e.event_type,e.reason,e.note,e.created_at,e.operation_id,u.display_name AS actor_name FROM ppo.commissioning_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by)
     WHERE e.workspace_id=$1 AND e.package_id=$2 AND ($3::uuid IS NULL OR e.commissioning_id=$3) AND ($4::text IS NULL OR e.subject_type=$4) ORDER BY e.created_at DESC,e.id DESC LIMIT $5`, [p.workspace_id, f.access.pkg.id, selected?.row.id ?? (recordId ? "00000000-0000-4000-8000-000000000000" : null), subject, limit + 1])).rows;
  const namesOf = new Map(f.records.map((l) => [l.row.id, `${l.row.reference} · ${l.row.title}`]));
  return { ...f.shell, selection: recordId ? (selected ? "Found" as const : "Unavailable" as const) : "None" as const, subjects,
    // Reasons and notes are internal working detail; someone with no internal duty reads that an event happened, by whom in role, and when.
    events: events.slice(0, limit).map(({ created_at, ...e }) => ({ ...e, reason: f.access.internal ? e.reason : withheld, note: f.access.internal ? e.note : null, actor_name: f.access.internal ? e.actor_name : "A permitted person", created_at: created_at.toISOString(), record_name: namesOf.get(e.commissioning_id) ?? "Package", event_label: label(e.event_type) })), has_more: events.length > limit };
}

// Engineering packages the actor may read, with the commissioning packages they hold. The picker never names a fixture.
export async function readEntry(p: Principal, query: unknown) {
  const q = object(query, ["q"]), page = await listEngineering(p, { q: q.q ?? "", limit: "100" });
  const found = page.items.length ? (await database().query<{ package_id: string; open: number; total: number }>(
    "SELECT package_id,count(*) FILTER (WHERE archived_at IS NULL)::int AS open,count(*)::int AS total FROM ppo.commissioning_packages WHERE workspace_id=$1 AND package_id=ANY($2::uuid[]) GROUP BY package_id", [p.workspace_id, page.items.map((i) => i.id)])).rows : [];
  return { items: page.items.map((i) => ({ id: i.id, reference: i.display_number, title: i.title, discipline: i.discipline, context_kind: i.context_kind, context_title: i.context_title, context_reference: i.context_reference, customer_name: i.customer_name, records: found.find((x) => x.package_id === i.id) ?? { open: 0, total: 0 } })),
    has_more: !!page.next_cursor, observed_at: page.observed_at };
}

// ---------------------------------------------------------------------------------------------
// A read-only preview of the record a candidate would issue. It renders nothing to PDF, stores nothing and issues nothing.
export async function readPreview(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["record", "release"]), f = await frame(p, packageId), l = f.records.find((x) => x.row.id === uuid(q.record, "record")), r = l?.releases.find((x) => x.id === uuid(q.release, "release"));
  if (!l || !r) throw unavailable();
  if (!f.access.internal) throw new AppError(403, "Forbidden", "A release preview is for the people who prepare, review and issue it.");
  const who = new Map((await f.c.query<{ id: string; display_name: string }>("SELECT id,display_name FROM ppo.users WHERE workspace_id=$1", [p.workspace_id])).rows.map((u) => [u.id, u.display_name]));
  // Until it is submitted a candidate is shown as it would be now; afterwards it is shown exactly as it was frozen.
  const manifest = r.state === "Draft" ? releaseManifest(l, f.access, r, who) : (r.manifest as ReturnType<typeof releaseManifest>);
  return { name: `${r.reference}-preview.html`, type: "text/html; charset=utf-8", body: Buffer.from(recordHtml(manifest, who, null)), disposition: "inline" as const };
}
// Exact output bytes. Permission and object scope are rechecked on every download, and the bytes are re-verified against every recorded hash.
export async function outputFile(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["output", "format"]), format = choice(q.format ?? "pdf", "format", ["pdf", "html"] as const), f = await frame(p, packageId), id = uuid(q.output, "output");
  const l = f.records.find((x) => x.outputs.some((o) => o.id === id)), o = l?.outputs.find((x) => x.id === id);
  if (!l || !o) throw unavailable();
  // Internal duties read any output of the package. A receiver reads the pack addressed to them, and the test record of the release it hands over.
  const mine = l.requests.filter((r) => r.handover.recipient_id === p.actor_id), allowed = f.access.internal || mine.some((r) => r.handover.id === o.handover_id || (o.kind === "OUT-12" && o.state === "Issued" && r.handover.release_id === o.release_id));
  if (!allowed || o.state === "Discarded") throw unavailable();
  const bytes = await readBundle(p, o), release = l.releases.find((r) => r.id === o.release_id)!;
  return { name: `${l.row.reference}-${release.reference}-r${pad(release.revision_number)}-${o.kind}${o.state === "Prepared" ? "-PREPARED-NOT-ISSUED" : ""}.${format}`, type: format === "pdf" ? "application/pdf" : "text/html; charset=utf-8", body: format === "pdf" ? bytes.pdf : Buffer.from(bytes.html), disposition: format === "pdf" ? "attachment" as const : "inline" as const,
    sha256: format === "pdf" ? o.pdf_sha256 : o.html_sha256 };
}
export async function evidenceFile(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["evidence"]), f = await frame(p, packageId), id = uuid(q.evidence, "evidence");
  if (!f.access.internal) throw unavailable();
  const e = f.records.flatMap((l) => l.attempts.flatMap((a) => a.evidence)).find((x) => x.id === id);
  if (!e || e.kind !== "StoredFile" || e.state !== "Complete") throw unavailable();
  return { name: e.label.replace(/[^A-Za-z0-9 _.-]/g, "_").slice(0, 80) + (e.media_type === "image/png" ? ".png" : ".txt"), type: e.media_type === "image/png" ? "image/png" : "text/plain; charset=utf-8", body: await evidenceBytes(p, e), disposition: "attachment" as const, sha256: e.content_hash! };
}

// Exports follow the reader's projection and neutralise formula-leading text. Exporting issues and distributes nothing.
export async function exportCsv(p: Principal, packageId: string, query: unknown) {
  const { record: _r, page: _p, page_size: _s, ...criteria } = object(query, ["view", "q", "workflow", "owner_id", "area", "blocker", "due", "sort", "dir", "page", "page_size", "record"]); void [_r, _p, _s];
  const data = await readRegister(p, packageId, { ...criteria, page: "1", page_size: "100" });
  return { name: `${data.package.reference}-commissioning.csv`, body: csv([["Synthetic local prototype", "Powerplants One", "Commissioning register"], ["Not an issue, approval, instruction or distribution of any controlled document"], ["Engineering package", data.package.reference, data.package.title], ["Generated", data.observed_at],
    ["Scope", `Filtered view “${data.criteria.view}” of this Engineering package; ${data.total} of ${data.counts.package_total} commissioning packages`], [],
    ["Reference", "Package", "Area", "System", "Test evidence", "Accepted", "Required", "Failed", "Not tested", "Unassessable", "As-built", "Next requirement", "Owner", "Due", "Test basis", "Installed configuration", "Release", "Service receiving"],
    ...data.items.map((r) => [r.reference, r.title, r.area, r.system_name, r.evidence_view.label, r.coverage.accepted, r.coverage.required, r.coverage.failed, r.coverage.not_tested, r.coverage.unassessable, r.as_built_view.label, r.next.label, r.owner_name ?? "Unassigned", r.due ?? "Date needed", r.basis ?? "", r.configuration ?? "", r.release_reference ?? "", r.service_view.label])]) };
}
export { templateVersion, packHtml };
