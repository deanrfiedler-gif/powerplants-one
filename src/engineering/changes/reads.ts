import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { unavailable } from "../../platform/errors";
import { choice, invalid, object, optionalId, uuid } from "../../shared/validation";
import { disciplines } from "../model";
import { listEngineering } from "../service";
import { changesAccess, contributors, dutyRefusal, loadPackageChanges, loadSources, stamp, type Access, type LiveSource, type LoadedChange } from "./context";
import { closureFacts } from "./commands";
import { buildPreview, handoverContext } from "./preview";
import { proposedRequests } from "./validation";
import {
  attentionCodes, attentionPresentation, closureBlockers, csv, decisionPresentation, isOpen, knownCostImpact, label, policyAllows, prerequisitesOutstanding, receivingPresentation,
  requestBlockers, scopeCompleteness, sourceConditions, sourcePresentation, stagePresentation, stages, submitBlockers, verificationPresentation, changesHref,
  type ChangeViewId, type Presentation,
} from "./model";

const tone = (text: string, t: Presentation["tone"]): Presentation => ({ label: text, tone: t, icon: ({ neutral: "dot", information: "info", caution: "warning", failure: "error", positive: "check" } as const)[t] });

// ---------------------------------------------------------------------------------------------
async function frame(p: Principal, packageId: string) {
  const c = database(), access = await changesAccess(c, p, packageId), sources = await loadSources(c, p, access), changes = await loadPackageChanges(c, p, access, sources);
  const open = changes.filter((l) => isOpen(l.row.stage));
  return {
    c, access, sources, changes,
    shell: {
      package: {
        id: access.pkg.id, reference: access.pkg.display_number, title: access.pkg.title, discipline: access.pkg.discipline, context_kind: access.pkg.context_kind, context_title: access.pkg.context_title,
        context_reference: access.pkg.context_reference, customer_name: access.pkg.customer_name, site_name: access.site_name, site_timezone: access.site_timezone,
      },
      can: access.can, costs_visible: access.costs, policy: { configured: !!access.policy, version: access.policy?.policy_version ?? null },
      // Menu badges are counts of this whole permitted package, never of a filtered page, and never a remembered number.
      menu: {
        scope: "Package" as const, reviews: open.filter((l) => l.row.stage === "InReview").length,
        handovers: open.reduce((n, l) => n + l.requests.filter((r) => r.handover.state === "Pending" || r.handover.state === "Returned").length, 0),
      },
      synthetic: true as const, observed_at: new Date().toISOString(),
    },
  };
}
type Frame = Awaited<ReturnType<typeof frame>>;

const basisText = (l: LoadedChange) => (l.baseline ? `${l.baseline.snapshot.reference} · ${l.baseline.snapshot.revision} → ${l.revision.proposed_revision ?? "?"}` : "Baseline needed");
function row(l: LoadedChange) {
  return {
    id: l.row.id, version: l.row.version, reference: l.row.reference, title: l.row.title, category: l.row.category, discipline: l.row.discipline, location: l.row.location, system_name: l.row.system_name,
    object_count: l.objects.filter((o) => o.disposition === "Included").length, basis: basisText(l), mixed_sources: l.links.filter((s) => s.required).length > 1,
    stage: l.row.stage, stage_view: stagePresentation[l.row.stage], decision: l.facts.decision, next_owner_id: l.row.next_owner_id, next_owner_name: l.row.next_owner_name, due: l.row.due,
    priority: l.row.priority, attention: l.attention, attention_view: attentionPresentation[l.attention], source: l.condition.condition, progress: l.progress,
    retests_required: l.verification.length, receiving: l.requests.map((r) => r.handover.state), updated_at: stamp(l.row.updated_at)!, author_id: l.row.author_id,
  };
}
type RegisterRow = ReturnType<typeof row>;

// What the inspector shows. Every label is a projection of a retained record: nothing here is a status of its own.
function followThrough(l: LoadedChange) {
  const out: { key: string; kind: "release" | "request" | "retest"; label: string; state: Presentation; href_view: ChangeViewId; record_id: string | null }[] = [];
  if (l.revision.requires_revised_release) {
    const request = l.requests.find((r) => r.handover.purpose === "PrepareRevisedRelease" && r.handover.state !== "Cancelled");
    out.push({ key: "release", kind: "release", label: "Revised technical release", record_id: request?.handover.id ?? null, href_view: "handovers",
      state: l.issued ? tone("Issued", "positive") : !request ? tone("Not requested", "neutral") : request.handover.state === "Accepted" ? tone("In preparation", "neutral") : request.handover.state === "Pending" ? tone("Requested", "neutral") : receivingPresentation[request.handover.state] });
  }
  for (const r of l.requests.filter((x) => x.handover.purpose !== "PrepareRevisedRelease" && x.handover.state !== "Cancelled"))
    out.push({ key: r.handover.id, kind: "request", record_id: r.handover.id, href_view: "handovers", state: receivingPresentation[r.handover.state],
      label: `${label(r.handover.destination).replace(/ \(.*\)$/, "")} ${r.handover.purpose === "Implementation" ? "handover" : r.handover.purpose === "Amendment" ? "amendment" : r.handover.purpose === "InformationRequired" ? "information" : "review"}` });
  for (const v of l.verification)
    out.push({ key: v.retest.id, kind: "retest", record_id: v.retest.id, href_view: "verification", label: `${v.retest.asset_or_system} retest`, state: verificationPresentation[!v.retest.procedure_source_id && v.state !== "Passed" && v.state !== "Failed" ? "TestBasisNeeded" : v.state] });
  return out;
}
function implementationView(l: LoadedChange): { view: Presentation; reasons: string[] } {
  if (l.facts.decision !== "Accepted") return { view: tone(l.facts.decision === "Rejected" ? "No implementation" : "Not decided", "neutral"), reasons: [] };
  if (l.progress !== "NotRequested") return { view: tone(label(l.progress), l.progress === "Complete" ? "positive" : l.progress === "Returned" ? "caution" : "neutral"), reasons: [] };
  const reasons = requestBlockers("Implementation", handoverContext(l));
  return reasons.length ? { view: tone("Not authorised", "caution"), reasons } : { view: tone("Ready for handover", "information"), reasons: [] };
}
function inspect(l: LoadedChange, access: Access, packageId: string) {
  const waiting = prerequisitesOutstanding(l.facts)[0], owner = waiting ? l.prerequisites.find((x) => x.kind === waiting.kind) : undefined, check = l.checks[0],
    included = l.objects.filter((o) => o.disposition === "Included"), commercial = l.prerequisites.find((x) => x.kind === "Commercial"), cost = l.revision.categories.find((k) => k.key === "cost"),
    href = (view: ChangeViewId, panel: string | null = null) => `${changesHref(packageId, view, l.row.id)}${panel ? `&panel=${panel}` : ""}`;
  return {
    ...row(l), technical_decision: decisionPresentation(l.facts.decision), applicability: l.applicability, implementation: implementationView(l),
    baseline: l.baseline ? { ...l.baseline.snapshot, purpose_label: label(l.baseline.snapshot.permitted_purpose), source_id: l.baseline.source_id } : null,
    proposed: { reference: l.revision.proposed_reference, revision: l.revision.proposed_revision, issued: l.issued ? { source_id: l.issued.id, observed_at: l.issued.observed_at, purpose_label: label(l.issued.permitted_purpose) } : null },
    // The time beside the indicator is the last recorded check. A condition detected since then shows at once, still with that time.
    sources: { view: sourcePresentation[l.condition.condition], condition: l.condition.condition, reasons: l.condition.reasons, checked_at: check ? stamp(check.checked_at) : null, checked_by: check?.checked_by_name ?? null, check_result: check?.result ?? null },
    summary: {
      installed_assets: included.filter((o) => o.object_type === "InstalledAsset").length, material_lines: included.filter((o) => o.object_type === "MaterialLine").length,
      retest: l.verification.length ? "Required" : l.revision.categories.find((k) => k.key === "retest")?.status === "NotApplicable" ? "Not required" : "Not assessed",
      cost_decision: commercial ? (commercial.applicability === "NotApplicable" ? "Not applicable" : commercial.state === "Open" ? "Pending review" : commercial.state) : cost ? (cost.status === "NotAssessed" ? "Not assessed" : cost.status === "NotApplicable" ? "Not applicable" : "With technical review") : "Not assessed",
      // Only the open review is a caution; a confirmed or inapplicable one is a plain fact, not a green one.
      cost_tone: (commercial && commercial.applicability !== "NotApplicable" && commercial.state === "Open" ? "caution" : "neutral") as Presentation["tone"],
    },
    blocking: waiting && owner ? { kind: waiting.kind, title: `${waiting.kind === "Commercial" ? "Commercial" : "Schedule"} review required`, text: "Implementation is not authorised until this prerequisite is resolved.", owner_name: owner.owner_name,
      // Someone who cannot resolve it still reads it, and is told whose it is.
      permitted: access.can.commercial ? null : `You can read this review. Resolving it belongs to ${owner.owner_name ?? "the commercial coordinator"}.` } : null,
    follow_through: followThrough(l),
    actions: {
      primary: { ...l.next, href: href(l.next.view, l.next.panel) },
      secondary: [{ label: "Review handover", href: href("handovers") }, { label: "Open impact assessment", href: href("impact") }].filter((a) => a.label !== l.next.label),
    },
    overlaps: l.overlaps.length, withdrawn_reason: l.row.withdrawn_reason, closure: l.closure ? { meaning: l.closure.meaning, closed_at: stamp(l.closure.closed_at), closed_by_name: l.closure.closed_by_name } : null,
  };
}

const registerViews = ["open", "mine", "review", "source", "receiving", "closed"] as const;
const sorts = ["due", "reference", "title", "scope", "stage", "owner", "attention", "updated"] as const;
export async function readRegister(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["view", "q", "stage", "discipline", "owner_id", "location", "attention", "source", "receiving", "sort", "dir", "page", "page_size", "change"]),
    view = choice(q.view ?? "open", "view", registerViews), text = q.q ?? "", page = Number(q.page ?? 1), size = Number(q.page_size ?? 25);
  if (typeof text !== "string" || text.length > 200) invalid("q", "Search up to 200 characters.");
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(size) || size < 1 || size > 100) invalid("page", "Use a page from 1 and a page size from 1 to 100.");
  const stage = q.stage ? choice(q.stage, "stage", stages) : null, discipline = q.discipline ? choice(q.discipline, "discipline", disciplines) : null, owner = optionalId(q.owner_id || undefined, "owner_id"),
    location = typeof q.location === "string" && q.location ? q.location.slice(0, 120) : null, attention = q.attention ? choice(q.attention, "attention", attentionCodes) : null,
    source = q.source ? choice(q.source, "source", sourceConditions) : null, receiving = q.receiving ? choice(q.receiving, "receiving", ["Pending", "Accepted", "Returned", "Declined", "Cancelled"] as const) : null,
    sort = choice(q.sort ?? "due", "sort", sorts), dir = choice(q.dir ?? "asc", "dir", ["asc", "desc"] as const), selectedId = optionalId(q.change || undefined, "change");
  const f = await frame(p, packageId), needle = (text as string).trim().toLowerCase();
  // Saved views are filters over the same records. They create no lifecycle state, and following a change is not owning its review.
  const inView = (l: LoadedChange, v: (typeof registerViews)[number]) => v === "closed" ? !isOpen(l.row.stage) : isOpen(l.row.stage) && (
    v === "open" || (v === "mine" ? l.row.next_owner_id === p.actor_id || l.reviews.some((r) => r.reviewer_id === p.actor_id && !r.result) || l.requests.some((r) => r.handover.owner_id === p.actor_id && r.handover.state === "Pending")
      : v === "review" ? l.row.stage === "InReview" : v === "source" ? ["Changed", "Withdrawn", "Unavailable"].includes(l.condition.condition) : l.requests.some((r) => r.handover.state === "Pending")));
  const searchable = (l: LoadedChange) => [l.row.reference, l.row.title, l.row.location, l.row.system_name, l.baseline?.snapshot.reference, l.revision.proposed_reference, ...l.links.map((s) => s.snapshot.reference), ...l.objects.flatMap((o) => [o.reference, o.title])];
  const conditioned = f.changes.filter((l) =>
    (!stage || l.row.stage === stage) && (!discipline || l.row.discipline === discipline) && (!owner || l.row.next_owner_id === owner) && (!location || l.row.location === location) &&
    (!attention || l.attention === attention) && (!source || l.condition.condition === source) && (!receiving || l.requests.some((r) => r.handover.state === receiving)) &&
    (!needle || searchable(l).some((v) => v?.toLowerCase().includes(needle))));
  const rows = conditioned.filter((l) => inView(l, view)).map(row);
  // An unknown value sorts last in either direction: a missing date is never treated as the earliest or the latest date.
  const key = (r: RegisterRow): string | null => ({ due: r.due, reference: r.reference, title: r.title.toLowerCase(), scope: `${r.location} ${r.system_name}`.toLowerCase(), stage: String(stages.indexOf(r.stage)).padStart(2, "0"), owner: r.next_owner_name?.toLowerCase() ?? null, attention: String(attentionCodes.indexOf(r.attention)).padStart(2, "0"), updated: r.updated_at })[sort];
  rows.sort((a, b) => { const x = key(a), y = key(b); return x === y ? a.reference.localeCompare(b.reference) : x === null ? 1 : y === null ? -1 : (x < y ? -1 : 1) * (dir === "asc" ? 1 : -1); });
  const selected = selectedId ? f.changes.find((l) => l.row.id === selectedId) : undefined;
  return {
    ...f.shell,
    criteria: { view, q: needle, stage, discipline, owner_id: owner, location, attention, source, receiving, sort, dir },
    counts: { scope: "Package" as const, conditioned: needle !== "" || !!(stage || discipline || owner || location || attention || source || receiving), views: Object.fromEntries(registerViews.map((v) => [v, conditioned.filter((l) => inView(l, v)).length])), package_total: f.changes.length },
    items: rows.slice((page - 1) * size, page * size), total: rows.length, page, page_size: size,
    // A selection that is missing, removed or outside this package is reported as such. The last permitted change is never left on screen under the wrong address.
    selected: selected ? inspect(selected, f.access, packageId) : null, selection: selectedId ? (selected ? "Found" as const : "Unavailable" as const) : "None" as const,
    options: {
      disciplines: [...new Set(f.changes.map((l) => l.row.discipline))].sort(), locations: [...new Set(f.changes.map((l) => l.row.location))].sort(),
      owners: [...new Map(f.changes.filter((l) => l.row.next_owner_id).map((l) => [l.row.next_owner_id!, l.row.next_owner_name!]))].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
      attention: [...new Set(f.changes.map((l) => l.attention))].map((code) => ({ code, label: attentionPresentation[code].label })),
    },
    completeness: "Complete" as const,
  };
}

// ---------------------------------------------------------------------------------------------
const sourceView = (s: LiveSource) => ({ id: s.id, kind: s.kind, reference: s.reference, title: s.title, revision: s.revision, file_version: s.file_version, content_hash: s.content_hash, permitted_purpose: s.permitted_purpose, purpose_label: label(s.permitted_purpose), observed_at: s.observed_at, use: s.use, successor_id: s.successor_id, restricted: s.restricted, readable: s.readable, adapter: s.adapter, change_reason: s.change_reason, changed_at: s.changed_at });
async function detail(f: Frame, p: Principal, l: LoadedChange, packageId: string) {
  const { access } = f, byId = new Map(f.sources.map((s) => [s.id, s])), authors = await contributors(f.c, p, l.row), mine = authors.has(p.actor_id),
    completeness = scopeCompleteness(l.document, l.condition.condition), cost = knownCostImpact(l.revision.costs), context = handoverContext(l),
    independence = (act: string) => (mine ? `You authored or changed this proposal, so you cannot ${act} it.` : null),
    myReview = l.reviews.find((r) => r.reviewer_id === p.actor_id && !r.result);
  return {
    inspector: inspect(l, access, packageId),
    change: { id: l.row.id, version: l.row.version, reference: l.row.reference, title: l.row.title, category: l.row.category, discipline: l.row.discipline, location: l.row.location, system_name: l.row.system_name, stage: l.row.stage,
      author_id: l.row.author_id, author_name: l.row.author_name, next_owner_id: l.row.next_owner_id, next_owner_name: l.row.next_owner_name, due: l.row.due, priority: l.row.priority, priority_reason: l.row.priority_reason,
      as_built_required: l.row.as_built_required, as_built_reference: l.row.as_built_reference, predecessor_change_id: l.row.predecessor_change_id, created_at: stamp(l.row.created_at), withdrawn_at: stamp(l.row.withdrawn_at), withdrawn_reason: l.row.withdrawn_reason },
    revision: { id: l.revision.id, version: l.revision.version, number: l.revision.revision_number, state: l.revision.state, content_hash: l.revision.content_hash, submitted_hash: l.revision.submitted_hash, submitted_at: stamp(l.revision.submitted_at), submitted_by_name: l.revision.submitted_by_name,
      return_kind: l.revision.return_kind, return_reason: l.revision.return_reason, returned_by_name: l.revision.returned_by_name, returned_at: stamp(l.revision.returned_at), return_owner_name: l.revision.return_owner_name, return_due: l.revision.return_due, editable: l.revision.state === "Working" && access.can.edit && isOpen(l.row.stage) },
    revisions: l.revisions.map((r) => ({ id: r.id, number: r.revision_number, state: r.state, submitted_at: stamp(r.submitted_at) })),
    // Cost amounts follow the reader's permission. Withheld is said plainly; it is never an empty list that reads as "no cost".
    document: { ...l.document, costs: access.costs ? l.document.costs : [], categories: l.document.categories.map((k) => (k.key === "cost" && !access.costs ? { ...k, finding: null, reason: null, evidence: null } : k)) },
    costs: access.costs ? { withheld: false as const, ...cost } : { withheld: true as const, note: "Cost detail is limited to the people who author, decide or commercially review this change." },
    objects: l.objects.map((o) => ({ ...o, owner_name: o.owner_name })),
    sources: l.links.map((s) => ({ ...s, source: byId.get(s.source_id) ? sourceView(byId.get(s.source_id)!) : null, changed: !!s.live && s.live.use !== "Current" })),
    completeness, source_condition: { ...l.condition, view: sourcePresentation[l.condition.condition] }, checks: l.checks.slice(0, 10).map((k) => ({ id: k.id, result: k.result, checked_at: stamp(k.checked_at), checked_by_name: k.checked_by_name, adapter: k.adapter })),
    overlaps: l.overlaps.map((o) => ({ ...o, decided: l.resolved.has(o.change_id), blocks_handover: (o.decision === "Accepted" || o.restricted) && !l.resolved.has(o.change_id) })),
    reviews: l.reviews.map((r) => ({ id: r.id, version: r.version, discipline: r.discipline, reviewer_id: r.reviewer_id, reviewer_name: r.reviewer_name, required: r.required, result: r.result, findings: r.findings, responded_at: stamp(r.responded_at), policy_version: r.policy_version, on_current_content: !r.revision_hash || r.revision_hash === l.revision.submitted_hash })),
    earlier_reviews: l.all_reviews.filter((r) => r.revision_id !== l.revision.id).map((r) => ({ id: r.id, revision_id: r.revision_id, discipline: r.discipline, reviewer_name: r.reviewer_name, result: r.result, findings: r.findings, responded_at: stamp(r.responded_at) })),
    decision: l.decision ? { id: l.decision.id, result: l.decision.result, purpose: l.decision.purpose, reason: l.decision.reason, option_key: l.decision.option_key, decided_by_name: l.decision.decided_by_name, decided_at: stamp(l.decision.decided_at), policy_version: l.decision.policy_version, revision_hash: l.decision.revision_hash, operation_id: l.decision.operation_id, applicability: l.applicability } : null,
    prerequisites: l.prerequisites.map((x) => ({ id: x.id, version: x.version, kind: x.kind, applicability: x.applicability, applicability_reason: access.costs || x.kind !== "Commercial" ? x.applicability_reason : "Commercial detail is withheld for this identity.", owner_id: x.owner_id, owner_name: x.owner_name, due: x.due, state: x.state,
      outcome_note: access.costs ? x.outcome_note : x.outcome_note ? "Recorded; detail withheld for this identity." : null, resolved_by_name: x.resolved_by_name, resolved_at: stamp(x.resolved_at), outcome_operation_id: x.outcome_operation_id, authority: x.authority,
      refusal: !access.can.commercial ? dutyRefusal("commercial") : x.owner_id && x.owner_id !== p.actor_id ? `This review is owned by ${x.owner_name}.` : independence("commercially review") ?? policyAllows(access.policy, p.actor_id, "CommercialReviewer") })),
    requests: l.requests.map((r) => {
      const last = r.submissions.at(-1)!, party = access.can.edit || access.can.decide || r.handover.owner_id === p.actor_id;
      return { id: r.handover.id, version: r.handover.version, purpose: r.handover.purpose, destination: r.handover.destination, owner_id: r.handover.owner_id, owner_name: r.handover.owner_name, requested_action: r.handover.requested_action, due: r.handover.due,
        state: r.handover.state, state_view: receivingPresentation[r.handover.state], stale: r.stale, amends_id: r.handover.amends_id, created_by_name: r.handover.created_by_name, created_at: stamp(r.handover.created_at), created_operation_id: r.handover.created_operation_id,
        acknowledgement_required: r.handover.acknowledgement_required, acknowledged_at: stamp(r.handover.acknowledged_at), cancelled_reason: r.handover.cancelled_reason, latest_submission_id: last.id,
        // The exact payload is for the people who prepared it and the receiver it names. Everyone else in scope sees its state and hash.
        submissions: r.submissions.map((s) => ({ id: s.id, number: s.submission_number, payload: party ? s.payload : null, payload_hash: s.payload_hash, submitted_by_name: s.submitted_by_name, submitted_at: stamp(s.submitted_at), outcome: s.outcome, outcome_reason: s.outcome_reason, outcome_evidence: s.outcome_evidence, outcome_by_name: s.outcome_by_name, outcome_at: stamp(s.outcome_at), outcome_operation_id: s.outcome_operation_id, return_owner_name: s.return_owner_name, return_due: s.return_due })),
        decide_refusal: !access.can.receive ? dutyRefusal("receive") : r.handover.owner_id !== p.actor_id ? `This request is addressed to ${r.handover.owner_name}.` : policyAllows(access.policy, p.actor_id, "Receiver", { destination: r.handover.destination }) };
    }),
    request_blockers: { Implementation: requestBlockers("Implementation", context), PrepareRevisedRelease: requestBlockers("PrepareRevisedRelease", context), ImpactReview: requestBlockers("ImpactReview", context) },
    verification: l.verification.map((v) => {
      const procedure = v.retest.procedure_source_id ? byId.get(v.retest.procedure_source_id) : undefined;
      return { ...v.retest, verifier_name: v.retest.verifier_name, state: v.state, state_view: verificationPresentation[!procedure && v.state !== "Passed" && v.state !== "Failed" ? "TestBasisNeeded" : v.state], procedure: procedure ? sourceView(procedure) : null,
        attempts: v.attempts.map((a) => ({ id: a.id, number: a.attempt_number, result: a.result, tested_at: stamp(a.tested_at), configuration_present: a.configuration_present, evidence_reference: a.evidence_reference, result_source: a.result_source, note: a.note, corrective_action: a.corrective_action, corrective_owner_name: a.corrective_owner_name, corrective_due: a.corrective_due, recorded_by_name: a.recorded_by_name, recorded_at: stamp(a.recorded_at) })),
        record_refusal: !access.can.verify ? dutyRefusal("verify") : independence("verify") ?? (v.retest.verifier_id && v.retest.verifier_id !== p.actor_id ? `This obligation names ${v.retest.verifier_name} as its verifier.` : policyAllows(access.policy, p.actor_id, "Verifier")) ?? (!procedure ? "Test basis needed: no approved test procedure is linked, so no result can be recorded." : null) };
    }),
    closure: l.closure ? { meaning: l.closure.meaning, reason: l.closure.reason, basis: l.closure.basis, basis_hash: l.closure.basis_hash, closed_by_name: l.closure.closed_by_name, closed_at: stamp(l.closure.closed_at), policy_version: l.closure.policy_version } : null,
    closure_readiness: { Implemented: closureBlockers("Implemented", closureFacts(l)), NoImplementation: closureBlockers("NoImplementation", closureFacts(l)), refusal: !access.can.close ? dutyRefusal("close") : independence("close") ?? policyAllows(access.policy, p.actor_id, "Closer") },
    // Reasons travel with the record, so a disabled positive action always has its explanation beside it.
    refusals: {
      edit: !access.can.edit ? dutyRefusal("edit") : null,
      submit: !access.can.edit ? dutyRefusal("edit") : l.revision.state !== "Working" ? "This proposal is already submitted." : null,
      submit_blockers: l.revision.state === "Working" ? submitBlockers(l.document, [{ discipline: l.row.discipline, required: true }], l.row.discipline, l.condition.condition) : [],
      respond: !access.can.review ? dutyRefusal("review") : independence("review") ?? (myReview ? policyAllows(access.policy, p.actor_id, "DisciplineReviewer", { discipline: myReview.discipline }) : "No review of this revision is assigned to you."),
      decide: !access.can.decide ? dutyRefusal("decide") : independence("decide") ?? policyAllows(access.policy, p.actor_id, "TechnicalAuthority", { discipline: l.row.discipline }),
    },
    my_review_id: myReview?.id ?? null,
  };
}

// The package queue of each focused destination. Each is the whole permitted package for that destination, never a page of it.
const openOnly = (changes: LoadedChange[]) => changes.filter((l) => isOpen(l.row.stage));
const impactQueue = (changes: LoadedChange[]) => openOnly(changes).filter((l) => ["Draft", "Assessing", "Returned"].includes(l.row.stage) || l.condition.condition !== "Current").map(row);
const reviewsQueue = (changes: LoadedChange[], actor: string) => openOnly(changes).filter((l) => l.row.stage === "InReview" || l.row.stage === "DecisionRecorded")
  .map((l) => ({ ...row(l), reviews: l.reviews.map((r) => ({ discipline: r.discipline, reviewer_name: r.reviewer_name, required: r.required, result: r.result, mine: r.reviewer_id === actor })) }));
const handoversQueue = (changes: LoadedChange[], actor: string) => changes.flatMap((l) => [
  ...l.prerequisites.filter((x) => x.applicability !== "NotApplicable").map((x) => ({ key: x.id, kind: "prerequisite" as const, change_id: l.row.id, reference: l.row.reference, title: l.row.title, what: `${x.kind} review`, destination: "Synthetic prerequisite", owner_name: x.owner_name, due: x.due,
    state_view: x.state === "Open" ? tone(x.applicability === "Unknown" ? "Applicability unknown" : "Open", "caution") : tone(x.state, x.state === "Confirmed" ? "positive" : "caution"), mine: x.owner_id === actor })),
  ...l.requests.map((r) => ({ key: r.handover.id, kind: "request" as const, change_id: l.row.id, reference: l.row.reference, title: l.row.title, what: label(r.handover.purpose), destination: label(r.handover.destination), owner_name: r.handover.owner_name as string | null, due: r.handover.due, state_view: receivingPresentation[r.handover.state], mine: r.handover.owner_id === actor })),
]);
const verificationQueue = (changes: LoadedChange[], actor: string) => changes.flatMap((l) => l.verification.map((v) => ({ key: v.retest.id, change_id: l.row.id, reference: l.row.reference, title: l.row.title, criterion: v.retest.criterion, asset_or_system: v.retest.asset_or_system, configuration: v.retest.configuration, verifier_name: v.retest.verifier_name, due: v.retest.due, attempts: v.attempts.length,
  state_view: verificationPresentation[!v.retest.procedure_source_id && v.state !== "Passed" && v.state !== "Failed" ? "TestBasisNeeded" : v.state], mine: v.retest.verifier_id === actor })));
export type ImpactQueueRow = ReturnType<typeof impactQueue>[number];
export type ReviewsQueueRow = ReturnType<typeof reviewsQueue>[number];
export type HandoversQueueRow = ReturnType<typeof handoversQueue>[number];
export type VerificationQueueRow = ReturnType<typeof verificationQueue>[number];

// SH-06 reads the same retained package state and access as the source workspace.
export async function changeReviewTasks(p: Principal, packageId: string): Promise<import("../../reviews/model").ReviewTask[]> {
  const f = await frame(p, packageId), items: import("../../reviews/model").ReviewTask[] = [];
  for (const l of f.changes) {
    const base = { source: "EngineeringChange" as const, module: "Engineering", record_id: l.row.id, company_id: f.access.pkg.company_id, package_id: packageId, reference: l.row.reference,
      revision: `r${l.revision.revision_number}`, version: l.row.version, title: l.row.title, context: [f.access.pkg.customer_name, f.access.site_name, l.row.location].filter(Boolean).join(" · "),
      submitted_at: stamp(l.revision.submitted_at), due: l.row.due, author_id: l.revision.submitted_by ?? l.row.author_id,
      status: l.row.stage, returned: l.row.stage === "Returned", return_reason: l.revision.return_reason, current: isOpen(l.row.stage), href: changesHref(packageId, "reviews", l.row.id) };
    for (const r of l.reviews) items.push({ ...base, id: `EngineeringChange:${r.id}`, kind: "Review", owner_id: r.reviewer_id, owner_name: r.reviewer_name,
      status: r.result ?? l.row.stage, current: !r.result && l.row.stage === "InReview", actionable: !r.result && l.row.stage === "InReview" && r.reviewer_id === p.actor_id && f.access.can.review && !policyAllows(f.access.policy, p.actor_id, "DisciplineReviewer", { discipline: r.discipline }) });
    if (l.row.stage === "Returned") items.push({ ...base, id: `EngineeringChange:${l.revision.id}`, kind: "Review", owner_id: l.revision.return_owner_id ?? l.row.author_id, owner_name: l.revision.return_owner_name ?? l.row.author_name, actionable: f.access.can.edit });
    for (const r of l.requests) {
      const last = r.submissions.at(-1)!, returned = r.handover.state === "Returned";
      items.push({ ...base, id: `EngineeringChange:${r.handover.id}`, kind: "Handover", title: `${label(r.handover.purpose)} · ${l.row.title}`,
        revision: `r${l.revision.revision_number} · handover v${r.handover.version}`, submitted_at: stamp(last.submitted_at), due: returned ? last.return_due : r.handover.due,
        owner_id: returned ? last.return_owner_id : r.handover.owner_id, owner_name: returned ? last.return_owner_name : r.handover.owner_name,
        author_id: last.submitted_by, status: r.handover.state, returned, return_reason: returned ? last.outcome_reason : null,
        current: ["Pending", "Returned"].includes(r.handover.state), actionable: returned ? f.access.can.edit : r.handover.state === "Pending" && f.access.can.receive && !r.stale && !policyAllows(f.access.policy, p.actor_id, "Receiver", { destination: r.handover.destination }), href: changesHref(packageId, "handovers", l.row.id) });
    }
  }
  return items;
}

// The five focused destinations share one read: the package queue for that destination, and the selected
// change in full when the address names one the reader may see.
export async function readView(p: Principal, packageId: string, query: unknown, view: "impact" | "reviews" | "handovers" | "verification") {
  const q = object(query, ["change"]), f = await frame(p, packageId), selectedId = optionalId(q.change || undefined, "change"), selected = selectedId ? f.changes.find((l) => l.row.id === selectedId) : undefined;
  const queue = view === "impact" ? impactQueue(f.changes) : view === "reviews" ? reviewsQueue(f.changes, p.actor_id) : view === "handovers" ? handoversQueue(f.changes, p.actor_id) : verificationQueue(f.changes, p.actor_id);
  return { ...f.shell, view, queue, selected: selected ? await detail(f, p, selected, packageId) : null, selection: selectedId ? (selected ? "Found" as const : "Unavailable" as const) : "None" as const,
    sources: f.sources.map(sourceView), site_timezone: f.access.site_timezone };
}

// Related-record discovery. It suggests candidates and says which relationship led to each; an authorised
// person includes or excludes every one with a reason. It claims no exhaustive dependency analysis: what it
// cannot see, it says it cannot see.
export async function readCandidates(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["change"]), f = await frame(p, packageId), l = f.changes.find((x) => x.row.id === uuid(q.change, "change"));
  if (!l) throw unavailable();
  const sourceIds = l.links.map((s) => s.source_id), has = new Set(l.objects.map((o) => o.object_key)), c = f.c;
  const lines = sourceIds.length ? (await c.query<{ id: string; line_number: string; description: string; location: string; served_areas: string[]; dependency_group: string | null; via: string; set_code: string }>(
    `SELECT l.id,l.line_number,l.description,l.location,l.served_areas,l.dependency_group,s.set_code,
      CASE WHEN l.drawing_source_id=ANY($3::uuid[]) OR l.basis_source_id=ANY($3::uuid[]) THEN 'source' ELSE 'group' END AS via
     FROM ppo.material_lines l JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(l.workspace_id,l.set_id)
     WHERE l.workspace_id=$1 AND s.package_id=$2 AND l.removed_at IS NULL AND (l.drawing_source_id=ANY($3::uuid[]) OR l.basis_source_id=ANY($3::uuid[])
       OR (l.dependency_group IS NOT NULL AND EXISTS(SELECT 1 FROM ppo.material_lines m WHERE (m.workspace_id,m.set_id,m.dependency_group)=(l.workspace_id,l.set_id,l.dependency_group) AND m.removed_at IS NULL AND (m.drawing_source_id=ANY($3::uuid[]) OR m.basis_source_id=ANY($3::uuid[])))))
     ORDER BY l.line_number`, [p.workspace_id, f.access.pkg.id, sourceIds])).rows : [];
  const releases = lines.length ? (await c.query<{ id: string; release_number: number; issue_state: string; line_numbers: string[] }>(
    `SELECT r.id,r.release_number,r.issue_state,array_agg(l.line_number ORDER BY l.line_number) AS line_numbers FROM ppo.material_releases r JOIN ppo.material_release_lines rl ON (rl.workspace_id,rl.release_id)=(r.workspace_id,r.id)
     JOIN ppo.material_lines l ON (l.workspace_id,l.id)=(rl.workspace_id,rl.line_id) WHERE r.workspace_id=$1 AND rl.line_id=ANY($2::uuid[]) AND r.review_state<>'Cancelled' GROUP BY r.id,r.release_number,r.issue_state ORDER BY r.release_number`, [p.workspace_id, lines.map((x) => x.id)])).rows : [];
  const assets = f.access.pkg.site_id ? (await c.query<{ id: string; display_number: string; description: string; lifecycle_status: string }>(
    "SELECT id,display_number,description,lifecycle_status FROM ppo.assets WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND lifecycle_status='Active' ORDER BY display_number LIMIT 50", [p.workspace_id, f.access.pkg.company_id, f.access.pkg.site_id])).rows : [];
  const items = [
    ...lines.map((x) => ({ object_type: "MaterialLine" as const, object_id: x.id, reference: `Line ${x.line_number} (set ${x.set_code})`, title: x.description, location: x.location, served_areas: x.served_areas, relation: x.via === "source" ? "This material line rests on a source in this change's source set." : `Same dependency group (“${x.dependency_group}”) as a line that rests on this change's sources.` })),
    ...releases.map((x) => ({ object_type: "MaterialRelease" as const, object_id: x.id, reference: `Material release ${x.release_number}`, title: `${label(x.issue_state)} release holding line ${x.line_numbers.join(", ")}`, location: null, served_areas: [] as string[], relation: "This release froze a material line that rests on this change's sources." })),
    ...assets.map((x) => ({ object_type: "InstalledAsset" as const, object_id: x.id, reference: x.display_number, title: x.description, location: l.row.location, served_areas: [] as string[], relation: "An active asset recorded at this package's site. Whether the change touches it is for the assessor to say." })),
  ].map((x) => ({ ...x, already_listed: has.has(`${x.object_type}:${x.object_id}`) }));
  return { items, limits: ["Suggestions come from released-material lines, their releases and active site assets only.", "Requirements, interfaces, purchase and receipt observations, milestones, job packs and tests have no runtime here: add them by exact reference.", "An empty list is not evidence of no impact."] };
}

export async function readPreview(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["change", "requests"]), f = await frame(p, packageId), l = f.changes.find((x) => x.row.id === uuid(q.change, "change"));
  if (!l) throw unavailable();
  let proposed: unknown;
  try { proposed = JSON.parse(String(q.requests ?? "")); } catch { invalid("requests", "The proposed requests could not be read."); }
  const preview = buildPreview(l, f.access, proposedRequests(proposed));
  // Existing related requests, so one can be corrected or reused instead of duplicated.
  return { ...preview, change_version: l.row.version, existing: l.requests.filter((r) => r.handover.state !== "Cancelled").map((r) => ({ id: r.handover.id, purpose: r.handover.purpose, destination: r.handover.destination, owner_name: r.handover.owner_name, state: r.handover.state, stale: r.stale })) };
}

// Form choices: people who may read this package, with the duties the capability and the policy both give them.
export async function readPeople(p: Principal, packageId: string, query: unknown) {
  object(query, []);
  const c = database(), access = await changesAccess(c, p, packageId);
  const rows = (await c.query<{ id: string; display_name: string; capabilities: string[] }>(
    `SELECT u.id,u.display_name,array_agg(DISTINCT g.capability ORDER BY g.capability) AS capabilities FROM ppo.users u JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(u.workspace_id,u.id)
     WHERE u.workspace_id=$1 AND u.active AND (g.capability LIKE 'engineering.%' OR g.capability='project.edit')
     AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
     AND (g.scope_type='Workspace' OR (g.company_id=$2 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$3::uuid))))
     GROUP BY u.id,u.display_name HAVING 'engineering.read'=ANY(array_agg(g.capability)) ORDER BY u.display_name,u.id LIMIT 100`, [p.workspace_id, access.pkg.company_id, access.pkg.site_id])).rows;
  const roles = (id: string) => access.policy?.grants.filter((g) => g.actor_id === id) ?? [];
  return { items: rows.map((r) => ({
    id: r.id, name: r.display_name, author: r.capabilities.includes("engineering.edit"), commercial: r.capabilities.includes("project.edit") && roles(r.id).some((g) => g.role === "CommercialReviewer"),
    reviewer_for: r.capabilities.includes("engineering.change.review") ? roles(r.id).filter((g) => g.role === "DisciplineReviewer").flatMap((g) => g.disciplines) : [],
    receiver_for: r.capabilities.includes("engineering.change.receive") ? roles(r.id).filter((g) => g.role === "Receiver").flatMap((g) => g.destinations) : [],
    verifier: r.capabilities.includes("engineering.change.verify") && roles(r.id).some((g) => g.role === "Verifier"),
  })), policy_configured: !!access.policy };
}

export async function readHistory(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["change", "subject", "limit"]), f = await frame(p, packageId), changeId = optionalId(q.change || undefined, "change"), limit = Number(q.limit ?? 100),
    subject = q.subject ? choice(q.subject, "subject", ["Change", "Revision", "Review", "Decision", "Prerequisite", "Handover", "Submission", "RetestAttempt", "SourceCheck", "OverlapDecision", "Closure"] as const) : null;
  if (!Number.isInteger(limit) || limit < 1 || limit > 300) invalid("limit", "Show 1 to 300 events.");
  const selected = changeId ? f.changes.find((l) => l.row.id === changeId) : undefined;
  const events = (await f.c.query<{ id: string; change_id: string; subject_type: string; subject_id: string; change_version: number; event_type: string; reason: string; note: string | null; created_at: Date; operation_id: string; actor_name: string }>(
    `SELECT e.id,e.change_id,e.subject_type,e.subject_id,e.change_version,e.event_type,e.reason,e.note,e.created_at,e.operation_id,u.display_name AS actor_name FROM ppo.change_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by)
     WHERE e.workspace_id=$1 AND e.package_id=$2 AND ($3::uuid IS NULL OR e.change_id=$3) AND ($4::text IS NULL OR e.subject_type=$4) ORDER BY e.created_at DESC,e.id DESC LIMIT $5`, [p.workspace_id, f.access.pkg.id, selected?.row.id ?? (changeId ? "00000000-0000-4000-8000-000000000000" : null), subject, limit + 1])).rows;
  const names = new Map(f.changes.map((l) => [l.row.id, `${l.row.reference} · ${l.row.title}`]));
  return {
    ...f.shell, selection: changeId ? (selected ? "Found" as const : "Unavailable" as const) : "None" as const,
    changes: f.changes.map((l) => ({ ...row(l), revisions: l.revisions.length, closure: l.closure ? { meaning: l.closure.meaning, closed_at: stamp(l.closure.closed_at) } : null })),
    events: events.slice(0, limit).map(({ created_at, ...e }) => ({ ...e, created_at: created_at.toISOString(), change_name: names.get(e.change_id) ?? "Change", event_label: label(e.event_type) })), has_more: events.length > limit,
    selected: selected ? {
      reference: selected.row.reference, title: selected.row.title,
      revisions: selected.revisions.map((r) => ({ id: r.id, number: r.revision_number, state: r.state, content_hash: r.content_hash, submitted_at: stamp(r.submitted_at), submitted_by_name: r.submitted_by_name, return_kind: r.return_kind, return_reason: r.return_reason, returned_at: stamp(r.returned_at), returned_by_name: r.returned_by_name })),
      decisions: selected.decisions.map((d) => ({ id: d.id, revision_id: d.revision_id, result: d.result, purpose: d.purpose, reason: d.reason, decided_by_name: d.decided_by_name, decided_at: stamp(d.decided_at), policy_version: d.policy_version, operation_id: d.operation_id })),
      checks: selected.checks.map((k) => ({ id: k.id, result: k.result, checked_at: stamp(k.checked_at), checked_by_name: k.checked_by_name })),
      closure: selected.closure ? { meaning: selected.closure.meaning, reason: selected.closure.reason, basis_hash: selected.closure.basis_hash, closed_by_name: selected.closure.closed_by_name, closed_at: stamp(selected.closure.closed_at) } : null,
    } : null,
    sources: f.sources.map(sourceView),
  };
}

// Packages the actor may read, with the changes they hold. The picker never names a fixture.
export async function readEntry(p: Principal, query: unknown) {
  const q = object(query, ["q"]), page = await listEngineering(p, { q: q.q ?? "", limit: "100" });
  const found = page.items.length ? (await database().query<{ package_id: string; open: number; total: number }>(
    "SELECT package_id,count(*) FILTER (WHERE stage NOT IN ('Closed','Withdrawn'))::int AS open,count(*)::int AS total FROM ppo.engineering_changes WHERE workspace_id=$1 AND package_id=ANY($2::uuid[]) GROUP BY package_id", [p.workspace_id, page.items.map((i) => i.id)])).rows : [];
  return {
    items: page.items.map((i) => ({ id: i.id, reference: i.display_number, title: i.title, discipline: i.discipline, context_kind: i.context_kind, context_title: i.context_title, context_reference: i.context_reference, customer_name: i.customer_name,
      changes: found.find((x) => x.package_id === i.id) ?? { open: 0, total: 0 } })),
    has_more: !!page.next_cursor, observed_at: page.observed_at,
  };
}

// Exports follow the reader's projection, keep source and decision times apart from the generated time, neutralise
// formula-leading text and never carry a cost the reader may not see. Exporting issues and distributes nothing.
export async function exportCsv(p: Principal, packageId: string, query: unknown) {
  const q = object(query, ["kind", "change", "ids", "view", "q", "stage", "discipline", "owner_id", "location", "attention", "source", "receiving", "sort", "dir"]), kind = choice(q.kind ?? "register", "kind", ["register", "assessment", "handover", "verification"] as const);
  const generated = new Date().toISOString(), head = (f: Frame, what: string) => [["Synthetic local prototype", "Powerplants One", what], ["Not an issue, approval, instruction or distribution of any controlled document"], ["Package", f.access.pkg.display_number, f.access.pkg.title], ["Generated", generated], []];
  if (kind === "register") {
    const { kind: _k, change: _c, ids: _i, ...criteria } = q; void [_k, _c, _i];
    // A ticked selection narrows the export to those records, each still read through this reader's own projection.
    const chosen = typeof q.ids === "string" && q.ids ? new Set(q.ids.split(",").slice(0, 100).map((id, i) => uuid(id, `ids-${i}`))) : null;
    const all = await readRegister(p, packageId, { ...(chosen ? {} : criteria), ...(chosen ? { view: "open" } : {}), page: "1", page_size: "100" }), f = await frame(p, packageId);
    const closed = chosen ? await readRegister(p, packageId, { view: "closed", page: "1", page_size: "100" }) : null;
    const data = chosen ? { ...all, items: [...all.items, ...closed!.items].filter((r) => chosen.has(r.id)), total: [...all.items, ...closed!.items].filter((r) => chosen.has(r.id)).length, criteria: { ...all.criteria, view: "ticked selection" as const } } : all;
    return { name: `${f.access.pkg.display_number}-changes.csv`, body: csv([...head(f, "Change register"), ["Scope", `${chosen ? "Ticked selection" : `Filtered view “${data.criteria.view}”`} of this package; ${data.total} of ${data.counts.package_total} changes`], [],
      ["Reference", "Change", "Location", "System", "Basis → proposal", "Review state", "Technical decision", "Next action owner", "Due", "Attention", "Source condition"],
      ...data.items.map((r) => [r.reference, r.title, r.location, r.system_name, r.basis, r.stage_view.label, r.decision, r.next_owner_name ?? "Unassigned", r.due ?? "Date needed", r.attention_view.label, r.source])]) };
  }
  const f = await frame(p, packageId), l = f.changes.find((x) => x.row.id === uuid(q.change, "change"));
  if (!l) throw unavailable();
  const d = await detail(f, p, l, packageId), title = [["Change", l.row.reference, l.row.title], ["Revision", l.revision.revision_number, label(l.revision.state), l.revision.submitted_hash ?? l.revision.content_hash], ["Baseline", d.inspector.baseline ? `${d.inspector.baseline.reference} revision ${d.inspector.baseline.revision}` : "None", d.inspector.baseline?.purpose_label ?? "", d.inspector.baseline ? `observed ${d.inspector.baseline.observed_at}` : ""], ["Source condition", d.source_condition.view.label, d.inspector.sources.checked_at ? `checked ${d.inspector.sources.checked_at}` : "not checked"], []];
  if (kind === "assessment")
    return { name: `${l.row.reference}-assessment.csv`, body: csv([...head(f, "Change assessment summary — a review aid"), ...title, ["Reason", l.revision.rationale ?? ""], [],
      ["Category", "Status", "Impact", "Finding", "Reason", "Evidence"], ...d.document.categories.map((k) => [k.key, label(k.status), k.impact ? label(k.impact) : "", k.finding, k.reason, k.evidence]), [],
      ["Affected object", "Type", "Disposition", "Proposed effect", "Location", "Areas served", "Exclusion reason"], ...d.objects.map((o) => [o.reference, label(o.object_type), o.disposition, o.proposed_effect, o.location, o.served_areas.join("; "), o.exclusion_reason]), [],
      ...(d.costs.withheld ? [["Cost", d.costs.note]] : [["Known cost impact (partial where unknown components exist)"], ...d.costs.groups.map((g) => [g.kind, g.known, g.currency, g.tax_basis, `${g.components} component(s)`]), ["Unknown components", d.costs.unknown.join("; ") || "None"]])]) };
  if (kind === "handover")
    return { name: `${l.row.reference}-handover-manifest.csv`, body: csv([...head(f, "Handover manifest"), ...title, ["Technical decision", d.decision ? `${d.decision.result} for ${label(d.decision.purpose)}` : "None", d.decision?.decided_at ?? ""], [],
      ["Request", "Purpose", "Destination", "Owner", "State", "Submission", "Payload hash", "Outcome", "Outcome time"],
      ...d.requests.flatMap((r) => r.submissions.map((s) => [r.id, label(r.purpose), label(r.destination), r.owner_name, r.state, s.number, s.payload_hash, s.outcome ?? "Pending", s.outcome_at ?? ""]))]) };
  return { name: `${l.row.reference}-verification.csv`, body: csv([...head(f, "Verification and closure report"), ...title, ["Closure", d.closure ? `${label(d.closure.meaning)} on ${d.closure.closed_at}` : "Open"], [],
    ["Criterion", "Asset or system", "Configuration", "Procedure", "State", "Attempt", "Result", "Tested at", "Configuration present", "Evidence"],
    ...d.verification.flatMap((v) => (v.attempts.length ? v.attempts : [null]).map((a) => [v.criterion, v.asset_or_system, v.configuration, v.procedure ? `${v.procedure.reference} ${v.procedure.revision}` : "Test basis needed", v.state_view.label, a?.number ?? "", a?.result ?? "", a?.tested_at ?? "", a?.configuration_present ?? "", a?.evidence_reference ?? ""]))]) };
}
