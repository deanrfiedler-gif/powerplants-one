import { common, commonKeys, object, uuid, label, narrative, optionalText, optionalId, dateOnly, instant, version, invalid, choice } from "../../shared/validation";
import { disciplines } from "../model";
import {
  assessmentCategories, categoryStatuses, changeCategories, closureMeanings, costKinds, dateMeanings, decisionPurposes, decisionResults, destinations, dispositions, objectTypes,
  optionKinds, parseMoney, priorities, requestPurposes, returnKinds, sourceRoles, supplyStates, taxBases,
  type AffectedObject, type CategoryFinding, type CategoryKey, type ChangeOption, type ComparisonRow, type CostComponent, type DateEffect, type RetestDefinition,
} from "./model";

// Every parser lists the keys it accepts, so a command carrying an approval flag, a hash, a role label, a
// readiness boolean, a total or a source purpose it was never asked for is refused before any rule runs.
const base = (p: Record<string, unknown>) => common(p);
function optionalDate(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return null;
  const date = dateOnly(value, field);
  if (date < "0001-01-01" || date > "9998-12-31") invalid(field, "Enter a date between years 0001 and 9998.");
  return date;
}
function flag(value: unknown, field: string, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") invalid(field, "Choose yes or no.");
  return value as boolean;
}
function list<T>(value: unknown, field: string, max: number, read: (item: unknown, i: number) => T, min = 0): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) return invalid(field, `Provide ${min} to ${max} entries.`);
  return value.map(read);
}
function unique(keys: string[], field: string) {
  if (new Set(keys).size !== keys.length) invalid(field, "Each entry appears once.");
}
const optionalChoice = <T extends string>(value: unknown, field: string, allowed: readonly T[]) => (value === null || value === undefined || value === "" ? null : choice(value, field, allowed));
const key = (value: unknown, field: string) => {
  const text = label(value, field, 40);
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(text)) invalid(field, "Use lower-case letters, digits and hyphens.");
  return text;
};

const headerKeys = ["title", "category", "discipline", "location", "system_name"];
const header = (raw: Record<string, unknown>) => ({
  title: label(raw.title, "title", 200), category: choice(raw.category, "category", changeCategories), discipline: choice(raw.discipline, "discipline", disciplines),
  location: label(raw.location, "location", 120), system_name: label(raw.system_name, "system_name", 120),
});
const coordinationKeys = ["next_owner_id", "due", "priority", "priority_reason"];
function coordination(raw: Record<string, unknown>) {
  const priority = optionalChoice(raw.priority, "priority", priorities), priority_reason = optionalText(raw.priority_reason, "priority_reason", 600);
  // A declared priority says why. It is shown apart from lifecycle and impact, grants no authority and bypasses no review.
  if (!!priority !== !!priority_reason) invalid("priority_reason", "A declared priority and its reason are recorded together.");
  return { next_owner_id: optionalId(raw.next_owner_id || undefined, "next_owner_id"), due: optionalDate(raw.due, "due"), priority, priority_reason };
}

export function parseChangeCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "revision_id", "change_id", "expected_version", "predecessor_change_id", ...headerKeys, ...coordinationKeys]);
  const action = choice(raw.action, "action", ["create", "coordinate", "withdraw"] as const);
  if (action === "create")
    return { ...base(raw), action, id: uuid(raw.id, "id"), revision_id: uuid(raw.revision_id, "revision_id"), ...header(raw), ...coordination(raw), predecessor_change_id: optionalId(raw.predecessor_change_id || undefined, "predecessor_change_id") };
  const target = { change_id: uuid(raw.change_id, "change_id"), expected_version: version(raw.expected_version) };
  if (action === "coordinate") return { ...base(raw), action, ...target, ...coordination(raw) };
  return { ...base(raw), action, ...target };
}

// ---------------------------------------------------------------------------------------------
const categoryKeys = assessmentCategories.map(([k]) => k) as readonly CategoryKey[];
function categories(value: unknown): CategoryFinding[] {
  const out = list(value ?? [], "categories", 9, (item, i) => {
    const c = object(item, ["key", "status", "impact", "finding", "reason", "evidence", "owner_id"]), status = choice(c.status, `categories-${i}`, categoryStatuses);
    return {
      key: choice(c.key, `categories-${i}`, categoryKeys), status, impact: status === "Assessed" ? optionalChoice(c.impact, `categories-${i}`, ["Impact", "NoImpact"] as const) : null,
      finding: optionalText(c.finding, `categories-${i}`, 1000), reason: optionalText(c.reason, `categories-${i}`, 1000), evidence: optionalText(c.evidence, `categories-${i}`, 400),
      owner_id: optionalId(c.owner_id || undefined, `categories-${i}`),
    };
  });
  unique(out.map((c) => c.key), "categories");
  return out;
}
function comparison(value: unknown): ComparisonRow[] {
  return list(value ?? [], "comparison", 40, (item, i) => {
    const r = object(item, ["attribute", "unit", "current", "proposed", "note"]);
    return { attribute: label(r.attribute, `comparison-${i}`, 120), unit: optionalText(r.unit, `comparison-${i}`, 20), current: optionalText(r.current, `comparison-${i}`, 300), proposed: optionalText(r.proposed, `comparison-${i}`, 300), note: optionalText(r.note, `comparison-${i}`, 400) };
  });
}
function options(value: unknown): ChangeOption[] {
  const out = list(value ?? [], "options", 6, (item, i) => {
    const o = object(item, ["key", "kind", "label", "assumptions", "impacts", "evidence"]);
    return { key: key(o.key, `options-${i}`), kind: choice(o.kind, `options-${i}`, optionKinds), label: label(o.label, `options-${i}`, 160), assumptions: optionalText(o.assumptions, `options-${i}`, 1000), impacts: optionalText(o.impacts, `options-${i}`, 1000), evidence: optionalText(o.evidence, `options-${i}`, 400) };
  });
  unique(out.map((o) => o.key), "options");
  return out;
}
function costs(value: unknown): CostComponent[] {
  const out = list(value ?? [], "costs", 20, (item, i) => {
    const c = object(item, ["key", "label", "kind", "amount", "currency", "tax_basis", "observed_on", "source", "confidence"]), field = `costs-${i}`;
    // An unknown component is recorded as unknown. It is never a blank that a total could read as zero.
    const amount = c.amount === null || c.amount === undefined || c.amount === "" ? null : typeof c.amount === "string" && parseMoney(c.amount.trim()) !== null ? c.amount.trim() : invalid(field, "Enter the amount as a decimal string with up to four decimal places, or leave it unknown.");
    const currency = label(c.currency, field, 3).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) invalid(field, "Use a three-letter currency code.");
    return { key: key(c.key, field), label: label(c.label, field, 160), kind: choice(c.kind, field, costKinds), amount, currency, tax_basis: choice(c.tax_basis, field, taxBases), observed_on: optionalDate(c.observed_on, field), source: optionalText(c.source, field, 300), confidence: optionalText(c.confidence, field, 120) };
  });
  unique(out.map((c) => c.key), "costs");
  return out;
}
function dates(value: unknown): DateEffect[] {
  const out = list(value ?? [], "dates", 20, (item, i) => {
    const d = object(item, ["key", "label", "meaning", "current", "proposed_effect", "owner_id"]), field = `dates-${i}`;
    return { key: key(d.key, field), label: label(d.label, field, 160), meaning: choice(d.meaning, field, dateMeanings), current: optionalDate(d.current, field), proposed_effect: label(d.proposed_effect, field, 400), owner_id: optionalId(d.owner_id || undefined, field) };
  });
  unique(out.map((d) => d.key), "dates");
  return out;
}
// object_key is never accepted from a client: the server derives it from the typed identity.
function objects(value: unknown): Omit<AffectedObject, "object_key">[] {
  return list(value ?? [], "objects", 80, (item, i) => {
    const o = object(item, ["id", "object_type", "object_id", "reference", "title", "current_state", "proposed_effect", "relation", "disposition", "exclusion_reason", "finding", "evidence", "owner_id", "next_action", "location", "served_areas", "supply_state"]), field = `objects-${i}`;
    const object_type = choice(o.object_type, field, objectTypes), disposition = choice(o.disposition ?? "Candidate", field, dispositions), exclusion_reason = optionalText(o.exclusion_reason, field, 600);
    if (disposition === "Excluded" && !exclusion_reason) invalid(field, "An exclusion needs its reason.");
    const supply_state = optionalChoice(o.supply_state, field, supplyStates);
    if (supply_state && object_type !== "SupplyObservation") invalid(field, "A supply state belongs to a supply observation.");
    return {
      id: uuid(o.id, field), object_type, object_id: optionalId(o.object_id || undefined, field), reference: label(o.reference, field, 120), title: label(o.title, field, 200),
      current_state: optionalText(o.current_state, field, 300), proposed_effect: optionalText(o.proposed_effect, field, 600), relation: label(o.relation, field, 400), disposition,
      exclusion_reason: disposition === "Excluded" ? exclusion_reason : null, finding: optionalText(o.finding, field, 1000), evidence: optionalText(o.evidence, field, 400),
      owner_id: optionalId(o.owner_id || undefined, field), next_action: optionalText(o.next_action, field, 300), location: optionalText(o.location, field, 120),
      served_areas: list(o.served_areas ?? [], field, 20, (area) => label(area, field, 120)), supply_state,
    };
  });
}
function sources(value: unknown) {
  const out = list(value ?? [], "sources", 30, (item, i) => {
    const s = object(item, ["source_id", "role", "required"]);
    return { source_id: uuid(s.source_id, `sources-${i}`), role: choice(s.role, `sources-${i}`, sourceRoles), required: flag(s.required, `sources-${i}`, true) };
  });
  unique(out.map((s) => s.source_id), "sources");
  if (out.filter((s) => s.role === "Baseline").length > 1) invalid("sources", "A proposal is measured against one exact baseline.");
  if (out.some((s) => s.role === "Baseline" && !s.required)) invalid("sources", "The baseline is always a required source.");
  return out;
}
function retests(value: unknown): RetestDefinition[] {
  return list(value ?? [], "retests", 20, (item, i) => {
    const r = object(item, ["id", "criterion", "requirement_ref", "asset_or_system", "configuration", "procedure_source_id", "reason", "verifier_id", "due"]), field = `retests-${i}`;
    return {
      id: uuid(r.id, field), criterion: label(r.criterion, field, 600), requirement_ref: optionalText(r.requirement_ref, field, 120), asset_or_system: label(r.asset_or_system, field, 200),
      configuration: label(r.configuration, field, 400), procedure_source_id: optionalId(r.procedure_source_id || undefined, field), reason: label(r.reason, field, 600),
      verifier_id: optionalId(r.verifier_id || undefined, field), due: optionalDate(r.due, field),
    };
  });
}
const documentKeys = ["rationale", "proposed_reference", "proposed_revision", "scope_statement", "requires_revised_release", "comparison", "options", "selected_option", "categories", "costs", "dates", "objects", "sources", "retests"];
function document(raw: Record<string, unknown>) {
  const proposed_revision = optionalText(raw.proposed_revision, "proposed_revision", 12);
  if (proposed_revision && !/^[A-Za-z0-9.]{1,12}$/.test(proposed_revision)) invalid("proposed_revision", "Use letters, digits and full stops only.");
  const opts = options(raw.options), selected_option = optionalText(raw.selected_option, "selected_option", 40);
  if (selected_option && !opts.some((o) => o.key === selected_option)) invalid("selected_option", "Select one of the documented options.");
  return {
    rationale: raw.rationale === null || raw.rationale === undefined || raw.rationale === "" ? null : narrative(raw.rationale, "rationale", 4000),
    proposed_reference: optionalText(raw.proposed_reference, "proposed_reference", 80), proposed_revision, scope_statement: optionalText(raw.scope_statement, "scope_statement", 2000),
    requires_revised_release: flag(raw.requires_revised_release, "requires_revised_release", true), comparison: comparison(raw.comparison), options: opts, selected_option,
    categories: categories(raw.categories), costs: costs(raw.costs), dates: dates(raw.dates), objects: objects(raw.objects), sources: sources(raw.sources), retests: retests(raw.retests),
  };
}

export function parseRevisionCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "change_id", "revision_id", "expected_version", "reviewers", ...headerKeys, ...documentKeys]);
  const action = choice(raw.action, "action", ["save", "begin", "submit", "revise", "check"] as const);
  const change_id = uuid(raw.change_id, "change_id");
  if (action === "check") return { ...base(raw), action, change_id };
  if (action === "begin") return { ...base(raw), action, change_id, expected_version: version(raw.expected_version) };
  if (action === "revise") return { ...base(raw), action, change_id, expected_version: version(raw.expected_version), id: uuid(raw.id, "id") };
  const target = { change_id, revision_id: uuid(raw.revision_id, "revision_id"), expected_version: version(raw.expected_version) };
  if (action === "save") return { ...base(raw), action, ...target, ...header(raw), ...document(raw) };
  const reviewers = list(raw.reviewers, "reviewers", 12, (item, i) => {
    const r = object(item, ["id", "discipline", "reviewer_id", "required"]);
    return { id: uuid(r.id, `reviewers-${i}`), discipline: choice(r.discipline, `reviewers-${i}`, disciplines), reviewer_id: uuid(r.reviewer_id, `reviewers-${i}`), required: flag(r.required, `reviewers-${i}`, true) };
  }, 1);
  unique(reviewers.map((r) => `${r.discipline}:${r.reviewer_id}`), "reviewers");
  return { ...base(raw), action, ...target, reviewers };
}

export function parseReviewCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "change_id", "revision_id", "review_id", "expected_version", "result", "findings", "purpose", "decision_reason", "return_kind", "owner_id", "due", "other_change_id", "decision"]);
  const action = choice(raw.action, "action", ["respond", "decide", "return", "overlap"] as const), change_id = uuid(raw.change_id, "change_id");
  if (action === "respond")
    return { ...base(raw), action, change_id, review_id: uuid(raw.review_id, "review_id"), expected_version: version(raw.expected_version), result: choice(raw.result, "result", ["NoBlockingFinding", "BlockingFinding", "ReturnForClarification"] as const), findings: narrative(raw.findings, "findings", 4000) };
  if (action === "overlap")
    return { ...base(raw), action, change_id, id: uuid(raw.id, "id"), expected_version: version(raw.expected_version), other_change_id: uuid(raw.other_change_id, "other_change_id"), decision: narrative(raw.decision, "decision", 2000) };
  const target = { change_id, revision_id: uuid(raw.revision_id, "revision_id"), expected_version: version(raw.expected_version) };
  if (action === "decide")
    return { ...base(raw), action, ...target, id: uuid(raw.id, "id"), result: choice(raw.result, "result", decisionResults), purpose: choice(raw.purpose, "purpose", decisionPurposes), decision_reason: narrative(raw.decision_reason, "decision_reason", 4000) };
  return { ...base(raw), action, ...target, return_kind: choice(raw.return_kind, "return_kind", returnKinds), decision_reason: narrative(raw.decision_reason, "decision_reason", 2000), owner_id: uuid(raw.owner_id, "owner_id"), due: dateOnly(raw.due, "due") };
}

export function parsePrerequisiteCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "change_id", "prerequisite_id", "expected_version", "outcome", "note", "evidence_source_id"]);
  choice(raw.action, "action", ["resolve"] as const);
  return { ...base(raw), action: "resolve" as const, change_id: uuid(raw.change_id, "change_id"), prerequisite_id: uuid(raw.prerequisite_id, "prerequisite_id"), expected_version: version(raw.expected_version),
    outcome: choice(raw.outcome, "outcome", ["Confirmed", "Declined"] as const), note: narrative(raw.note, "note", 2000), evidence_source_id: optionalId(raw.evidence_source_id || undefined, "evidence_source_id") };
}

// A proposed request names its purpose, destination, owner and action. Its payload is derived by the server.
export function proposedRequests(value: unknown) {
  const out = list(value, "requests", 12, (item, i) => {
    const r = object(item, ["id", "purpose", "destination", "owner_id", "requested_action", "due", "amends_id"]), field = `requests-${i}`, purpose = choice(r.purpose, field, requestPurposes), amends_id = optionalId(r.amends_id || undefined, field);
    if ((purpose === "Amendment") !== !!amends_id) invalid(field, "An amendment names the accepted request it amends; other requests name none.");
    return { id: uuid(r.id, field), purpose, destination: choice(r.destination, field, destinations), owner_id: uuid(r.owner_id, field), requested_action: label(r.requested_action, field, 600), due: optionalDate(r.due, field), amends_id };
  }, 1);
  unique(out.map((r) => r.id), "requests");
  unique(out.map((r) => `${r.purpose}:${r.destination}:${r.amends_id ?? ""}`), "requests");
  return out;
}
export function parseHandoverCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "change_id", "expected_version", "preview_hash", "requests", "handover_id", "submission_id", "correction_note", "outcome", "outcome_reason", "outcome_evidence", "owner_id", "due"]);
  const action = choice(raw.action, "action", ["confirm", "resubmit", "decide", "cancel", "acknowledge"] as const), change_id = uuid(raw.change_id, "change_id");
  const hash = () => { const h = label(raw.preview_hash, "preview_hash", 64); if (!/^[a-f0-9]{64}$/.test(h)) invalid("preview_hash", "Review the exact preview before confirming."); return h; };
  if (action === "confirm") return { ...base(raw), action, change_id, expected_version: version(raw.expected_version), preview_hash: hash(), requests: proposedRequests(raw.requests) };
  const target = { change_id, handover_id: uuid(raw.handover_id, "handover_id"), expected_version: version(raw.expected_version) };
  if (action === "resubmit") return { ...base(raw), action, ...target, id: uuid(raw.id, "id"), preview_hash: hash(), correction_note: narrative(raw.correction_note, "correction_note", 2000) };
  if (action === "decide") {
    const outcome = choice(raw.outcome, "outcome", ["Accepted", "Returned", "Declined"] as const), owner_id = optionalId(raw.owner_id || undefined, "owner_id"), due = optionalDate(raw.due, "due");
    if (outcome === "Returned" && (!owner_id || !due)) invalid("owner_id", "A return names who corrects it and by when.");
    if (outcome !== "Returned" && (owner_id || due)) invalid("owner_id", "Only a return carries a correction owner and date.");
    return { ...base(raw), action, ...target, submission_id: uuid(raw.submission_id, "submission_id"), outcome, outcome_reason: narrative(raw.outcome_reason, "outcome_reason", 2000), outcome_evidence: optionalText(raw.outcome_evidence, "outcome_evidence", 600), owner_id, due };
  }
  if (action === "cancel") return { ...base(raw), action, ...target };
  return { ...base(raw), action, ...target };
}

export function parseVerificationCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "change_id", "expected_version", "retest_id", "result", "tested_at", "configuration_present", "evidence_reference", "evidence_source_id", "note",
    "corrective_action", "corrective_owner_id", "corrective_due", "as_built_required", "as_built_reference", "meaning"]);
  const action = choice(raw.action, "action", ["attempt", "as_built", "close"] as const), target = { change_id: uuid(raw.change_id, "change_id"), expected_version: version(raw.expected_version) };
  if (action === "as_built") {
    const as_built_required = flag(raw.as_built_required, "as_built_required"), as_built_reference = optionalText(raw.as_built_reference, "as_built_reference", 300);
    if (!as_built_required && as_built_reference) invalid("as_built_reference", "A reference is recorded only where as-built evidence is required.");
    return { ...base(raw), action, ...target, as_built_required, as_built_reference };
  }
  if (action === "close") return { ...base(raw), action, ...target, id: uuid(raw.id, "id"), meaning: choice(raw.meaning, "meaning", closureMeanings) };
  const result = choice(raw.result, "result", ["Passed", "Failed"] as const), corrective_action = optionalText(raw.corrective_action, "corrective_action", 1000),
    corrective_owner_id = optionalId(raw.corrective_owner_id || undefined, "corrective_owner_id"), corrective_due = optionalDate(raw.corrective_due, "corrective_due");
  if (result === "Failed" && (!corrective_action || !corrective_owner_id || !corrective_due)) invalid("corrective_action", "A failed test names the corrective work, who owns it and by when.");
  if (result === "Passed" && (corrective_action || corrective_owner_id || corrective_due)) invalid("corrective_action", "Only a failed test carries corrective work.");
  return {
    ...base(raw), action, ...target, id: uuid(raw.id, "id"), retest_id: uuid(raw.retest_id, "retest_id"), result, tested_at: instant(raw.tested_at, "tested_at"),
    configuration_present: label(raw.configuration_present, "configuration_present", 400), evidence_reference: label(raw.evidence_reference, "evidence_reference", 400),
    evidence_source_id: optionalId(raw.evidence_source_id || undefined, "evidence_source_id"), note: optionalText(raw.note, "note", 2000), corrective_action, corrective_owner_id, corrective_due,
  };
}
