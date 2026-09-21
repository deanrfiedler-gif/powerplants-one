import { choice, common, commonKeys, dateOnly, instant, invalid, label, narrative, object, optionalId, optionalNarrative, optionalText, uuid, version } from "../../shared/validation";
import { checkTypes, conditionOutcomes, decimalPlaces, parseDecimal, readingStates, reviewDecisions, witnessKinds, type CheckDefinition, type Prerequisite, type Reading } from "../../inspections/model";
import {
  associationKinds, comparisonKinds, destinations, differenceDispositions, dueMeanings, identityStates, obligationKinds, obligationStates, receivingOutcomes, redlineClasses, releaseStages, requiredStages, scopeKinds,
  type ScopeItem, type SharedInterface,
} from "./model";

// Every parser lists the keys it accepts, so a command carrying an approval flag, a hash, a role label, a
// readiness boolean, a count, a status or an evaluation it was never asked for is refused before any rule runs.
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
  const text = label(value, field, 80);
  if (!/^[a-z0-9][a-z0-9:-]{0,79}$/.test(text)) invalid(field, "Use lower-case letters, digits, hyphens and colons.");
  return text;
};
const optionalKey = (value: unknown, field: string) => (value === null || value === undefined || value === "" ? null : key(value, field));
const decimal = (value: unknown, field: string) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || parseDecimal(value) === null) invalid(field, "Enter a plain decimal number as text, with up to twelve decimal places.");
  return (value as string).trim();
};
const revision = (value: unknown, field: string) => {
  const text = label(value, field, 12);
  if (!/^[A-Za-z0-9.]{1,12}$/.test(text)) invalid(field, "Use up to twelve letters, digits or full stops.");
  return text;
};
// A new row has no version yet; an existing one is changed only from the version the client was shown.
const optionalVersion = (value: unknown) => (value === null || value === undefined ? null : version(value));
const target = (raw: Record<string, unknown>) => ({ record_id: uuid(raw.record_id, "record_id"), expected_version: version(raw.expected_version) });
const coordinationKeys = ["owner_id", "due", "due_meaning", "release_stage"];
function coordination(raw: Record<string, unknown>) {
  const due = optionalDate(raw.due, "due"), due_meaning = optionalChoice(raw.due_meaning, "due_meaning", dueMeanings);
  // A date says what it is a date of. A due date never doubles as a commissioning, training, warranty or handover date.
  if (due && !due_meaning) invalid("due_meaning", "Say what this date means.");
  return { owner_id: optionalId(raw.owner_id || undefined, "owner_id"), due, due_meaning: due ? due_meaning : null, release_stage: choice(raw.release_stage ?? "WholeScope", "release_stage", releaseStages) };
}

// ---------------------------------------------------------------------------------------------
function scopeItems(value: unknown): ScopeItem[] {
  const out = list(value ?? [], "items", 60, (item, i) => {
    const r = object(item, ["key", "kind", "asset_id", "reference", "title", "installed_location", "served_areas", "disposition", "exclusion_reason", "critical"]), field = `items-${i}`, disposition = choice(r.disposition ?? "Included", field, ["Included", "Excluded"] as const);
    const exclusion_reason = optionalText(r.exclusion_reason, field, 600);
    if (disposition === "Excluded" && !exclusion_reason) invalid(field, "An excluded scope item needs its reason.");
    return {
      key: key(r.key, field), kind: choice(r.kind, field, scopeKinds), asset_id: optionalId(r.asset_id || undefined, field), reference: label(r.reference, field, 120), title: label(r.title, field, 200),
      installed_location: optionalText(r.installed_location, field, 120), served_areas: list(r.served_areas ?? [], field, 20, (a) => label(a, field, 120)), disposition, exclusion_reason: disposition === "Excluded" ? exclusion_reason : null,
      // Identity is never accepted from a client: the server reads it from the canonical asset record.
      identity: identityStates[2], critical: flag(r.critical, field),
    };
  });
  unique(out.map((o) => o.key), "items");
  return out;
}
function interfaces(value: unknown): SharedInterface[] {
  const out = list(value ?? [], "interfaces", 20, (item, i) => {
    const r = object(item, ["key", "label", "items", "assessment", "note"]), field = `interfaces-${i}`, assessment = choice(r.assessment ?? "Unassessed", field, ["Unassessed", "Independent", "Blocking"] as const), note = optionalText(r.note, field, 600);
    if (assessment !== "Unassessed" && !note) invalid(field, "An assessment of a shared interface needs its reasoning.");
    return { key: key(r.key, field), label: label(r.label, field, 200), items: list(r.items, field, 20, (k) => key(k, field), 2), assessment, note };
  });
  unique(out.map((o) => o.key), "interfaces");
  return out;
}
export function parsePackageCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "scope_id", "record_id", "expected_version", "title", "system_name", "area", ...coordinationKeys, "statement", "items", "interfaces", "result", "evidence"]);
  const action = choice(raw.action, "action", ["create", "coordinate", "scope", "rescope", "check", "assess", "archive"] as const);
  if (action === "create") return { ...base(raw), action, id: uuid(raw.id, "id"), scope_id: uuid(raw.scope_id, "scope_id"), title: label(raw.title, "title", 200), system_name: label(raw.system_name, "system_name", 120), area: label(raw.area, "area", 120), ...coordination(raw) };
  if (action === "check") return { ...base(raw), action, record_id: uuid(raw.record_id, "record_id") };
  if (action === "assess") return { ...base(raw), action, record_id: uuid(raw.record_id, "record_id"), result: choice(raw.result, "result", ["Current", "ReassessmentRequired", "Unavailable"] as const), evidence: label(raw.evidence, "evidence", 600) };
  if (action === "coordinate") return { ...base(raw), action, ...target(raw), ...coordination(raw) };
  if (action === "scope") return { ...base(raw), action, ...target(raw), scope_id: uuid(raw.scope_id, "scope_id"), statement: optionalNarrative(raw.statement, "statement", 2000), items: scopeItems(raw.items), interfaces: interfaces(raw.interfaces) };
  if (action === "rescope") return { ...base(raw), action, ...target(raw), id: uuid(raw.id, "id") };
  return { ...base(raw), action, ...target(raw) };
}

// ---------------------------------------------------------------------------------------------
function checks(value: unknown): CheckDefinition[] {
  const out = list(value ?? [], "checks", 80, (item, i): CheckDefinition => {
    const r = object(item, ["key", "name", "check_type", "required", "scope_key", "numeric", "qualitative", "condition", "evidence_min", "instrument_required", "witness", "criterion_source_id"]), field = `checks-${i}`, check_type = choice(r.check_type, field, checkTypes);
    let numeric: CheckDefinition["numeric"] = null, qualitative: CheckDefinition["qualitative"] = null;
    if (check_type === "Numeric" && r.numeric !== null && r.numeric !== undefined) {
      const n = object(r.numeric, ["unit", "precision", "lower", "lower_inclusive", "upper", "upper_inclusive", "conversions"]), precision = Number(n.precision ?? 0), lower = decimal(n.lower, field), upper = decimal(n.upper, field);
      if (!Number.isInteger(precision) || precision < 0 || precision > 12) invalid(field, "Precision is a whole number of decimal places from 0 to 12.");
      for (const limit of [lower, upper]) if (limit !== null && decimalPlaces(limit) > precision) invalid(field, "A limit is stated to the precision the check accepts.");
      if (lower !== null && upper !== null && parseDecimal(lower)! > parseDecimal(upper)!) invalid(field, "The lower limit cannot exceed the upper limit.");
      numeric = { unit: label(n.unit, field, 20), precision, lower, lower_inclusive: flag(n.lower_inclusive, field, true), upper, upper_inclusive: flag(n.upper_inclusive, field, true),
        conversions: list(n.conversions ?? [], field, 6, (k) => { const v = object(k, ["from_unit", "multiply", "add"]); return { from_unit: label(v.from_unit, field, 20), multiply: decimal(v.multiply, field) ?? invalid(field, "A conversion needs its factor."), add: decimal(v.add ?? "0", field) ?? "0" }; }) };
    }
    if (check_type === "Qualitative" && r.qualitative !== null && r.qualitative !== undefined) {
      const q = object(r.qualitative, ["choices", "accepted"]), choices = list(q.choices, field, 12, (k) => label(k, field, 80), 2), accepted = list(q.accepted ?? [], field, 12, (k) => label(k, field, 80));
      if (accepted.some((a) => !choices.includes(a))) invalid(field, "An accepted outcome is one of the approved choices.");
      qualitative = { choices, accepted };
    }
    const evidence_min = Number(r.evidence_min ?? 0);
    if (!Number.isInteger(evidence_min) || evidence_min < 0 || evidence_min > 10) invalid(field, "Require 0 to 10 items of evidence.");
    let condition: CheckDefinition["condition"] = null;
    if (r.condition !== null && r.condition !== undefined) { const k = object(r.condition, ["statement", "outcome"]); condition = { statement: label(k.statement, field, 300), outcome: choice(k.outcome, field, conditionOutcomes) }; }
    return { key: key(r.key, field), name: label(r.name, field, 160), check_type, required: flag(r.required, field, true), scope_key: optionalKey(r.scope_key, field), numeric, qualitative, condition, evidence_min,
      instrument_required: flag(r.instrument_required, field), witness: choice(r.witness ?? "None", field, witnessKinds), criterion_source_id: optionalId(r.criterion_source_id || undefined, field) };
  });
  unique(out.map((c) => c.key), "checks");
  return out;
}
const prerequisiteKinds = ["Access", "Isolation", "Competency", "Biosecurity", "Crop", "Instrument", "Witness", "Hold"] as const;
function prerequisites(value: unknown, withOutcome: boolean): Prerequisite[] {
  const out = list(value ?? [], "prerequisites", 30, (item, i): Prerequisite => {
    const r = object(item, ["key", "label", "kind", "mandatory", "met", "source"]), field = `prerequisites-${i}`;
    return { key: key(r.key, field), label: label(r.label, field, 200), kind: choice(r.kind, field, prerequisiteKinds), mandatory: flag(r.mandatory, field, true), met: withOutcome ? flag(r.met, field) : false, source: optionalText(r.source, field, 300) };
  });
  unique(out.map((x) => x.key), "prerequisites");
  return out;
}
export function parseBasisCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "record_id", "basis_id", "expected_version", "reference", "revision", "procedure_source_id", "drawing_source_id", "configuration_source_id", "checks", "prerequisites", "decision_reason", "owner_id", "due"]);
  const action = choice(raw.action, "action", ["create", "save", "submit", "approve", "return"] as const), reasoned = () => narrative(raw.decision_reason, "decision_reason", 2000);
  if (action === "create") return { ...base(raw), action, id: uuid(raw.id, "id"), ...target(raw), reference: label(raw.reference, "reference", 40), revision: revision(raw.revision, "revision") };
  const on = { ...target(raw), basis_id: uuid(raw.basis_id, "basis_id") };
  if (action === "save") return { ...base(raw), action, ...on, reference: label(raw.reference, "reference", 40), revision: revision(raw.revision, "revision"), procedure_source_id: optionalId(raw.procedure_source_id || undefined, "procedure_source_id"),
    drawing_source_id: optionalId(raw.drawing_source_id || undefined, "drawing_source_id"), configuration_source_id: optionalId(raw.configuration_source_id || undefined, "configuration_source_id"), checks: checks(raw.checks), prerequisites: prerequisites(raw.prerequisites, false) };
  if (action === "submit") return { ...base(raw), action, ...on };
  if (action === "approve") return { ...base(raw), action, ...on, decision_reason: reasoned() };
  return { ...base(raw), action, ...on, decision_reason: reasoned(), owner_id: uuid(raw.owner_id, "owner_id"), due: dateOnly(raw.due, "due") };
}

// ---------------------------------------------------------------------------------------------
function readings(value: unknown): Reading[] {
  const out = list(value ?? [], "readings", 80, (item, i): Reading => {
    const r = object(item, ["check_key", "state", "value", "unit", "choice", "reason", "note"]), field = `readings-${i}`;
    // An evaluation is never accepted from a client. The server computes it from the raw entry and the frozen criterion.
    return { check_key: key(r.check_key, field), state: choice(r.state, field, readingStates), value: decimal(r.value, field), unit: optionalText(r.unit, field, 20), choice: optionalText(r.choice, field, 80), reason: optionalText(r.reason, field, 600), note: optionalText(r.note, field, 1000), evidence_ids: [] };
  });
  unique(out.map((r) => r.check_key), "readings");
  return out;
}
const severities = ["Unclassified", "Minor", "Major", "Critical"] as const;
function evidence(value: unknown) {
  const r = object(value, ["id", "check_key", "label", "purpose", "access_class", "kind", "source_id", "field_entry_id", "field_entry_revision", "media_type", "byte_count", "sha256", "content_base64"]), kind = choice(r.kind, "kind", ["RetainedSource", "FieldEntry", "StoredFile"] as const);
  const shared = { id: uuid(r.id, "id"), check_key: optionalKey(r.check_key, "check_key"), label: label(r.label, "label", 200), purpose: label(r.purpose, "purpose", 300), access_class: choice(r.access_class ?? "Internal", "access_class", ["Internal", "CustomerSafe"] as const) };
  if (kind === "RetainedSource") return { ...shared, kind, source_id: uuid(r.source_id, "source_id") };
  if (kind === "FieldEntry") return { ...shared, kind, field_entry_id: uuid(r.field_entry_id, "field_entry_id"), field_entry_revision: version(r.field_entry_revision) };
  const byte_count = Number(r.byte_count), hash = label(r.sha256, "sha256", 64);
  if (!Number.isSafeInteger(byte_count) || byte_count < 1 || byte_count > 4_194_304) invalid("byte_count", "Evidence files are 1 byte to 4 MiB.");
  if (!/^[a-f0-9]{64}$/.test(hash)) invalid("sha256", "Provide the SHA-256 of the exact bytes.");
  if (r.content_base64 !== null && r.content_base64 !== undefined && (typeof r.content_base64 !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(r.content_base64) || r.content_base64.length % 4 !== 0)) invalid("content_base64", "The file content is not valid base64.");
  return { ...shared, kind, media_type: label(r.media_type, "media_type", 80), byte_count, sha256: hash, content_base64: (r.content_base64 as string | null | undefined) ?? null };
}
export function parseInspectionCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "record_id", "attempt_id", "defect_id", "evidence_id", "expected_version", "check_keys", "scope_keys", "predecessor_id", "configuration_reference", "configuration_source_id", "occurred_at", "timezone",
    "clock_concern", "prerequisites", "findings", "readings", "instrument_ids", "evidence", "decision", "decision_reason", "owner_id", "due", "severity", "proposed_correction", "retest_required", "changes_system", "change_id", "note"]);
  const action = choice(raw.action, "action", ["open", "save", "evidence", "remove_evidence", "submit", "review", "clarify", "defect", "correct"] as const), record_id = uuid(raw.record_id, "record_id");
  if (action === "open") return { ...base(raw), action, id: uuid(raw.id, "id"), record_id, expected_version: version(raw.expected_version), check_keys: list(raw.check_keys ?? [], "check_keys", 80, (k) => key(k, "check_keys")), scope_keys: list(raw.scope_keys ?? [], "scope_keys", 60, (k) => key(k, "scope_keys")), predecessor_id: optionalId(raw.predecessor_id || undefined, "predecessor_id") };
  if (action === "defect" || action === "correct") {
    const on = { record_id, defect_id: uuid(raw.defect_id, "defect_id"), expected_version: version(raw.expected_version) };
    if (action === "correct") return { ...base(raw), action, ...on, note: narrative(raw.note, "note", 2000) };
    return { ...base(raw), action, ...on, owner_id: uuid(raw.owner_id, "owner_id"), due: dateOnly(raw.due, "due"), severity: choice(raw.severity ?? "Unclassified", "severity", severities), proposed_correction: optionalText(raw.proposed_correction, "proposed_correction", 1000),
      retest_required: flag(raw.retest_required, "retest_required", true), changes_system: flag(raw.changes_system, "changes_system"), change_id: optionalId(raw.change_id || undefined, "change_id") };
  }
  const attempt_id = uuid(raw.attempt_id, "attempt_id");
  if (action === "review") {
    const decision = choice(raw.decision, "decision", reviewDecisions), owned = decision !== "Accepted";
    return { ...base(raw), action, id: uuid(raw.id, "id"), record_id, attempt_id, decision, decision_reason: narrative(raw.decision_reason, "decision_reason", 4000), owner_id: owned ? uuid(raw.owner_id, "owner_id") : null, due: owned ? dateOnly(raw.due, "due") : null };
  }
  if (action === "clarify") return { ...base(raw), action, id: uuid(raw.id, "id"), record_id, attempt_id, decision_reason: narrative(raw.decision_reason, "decision_reason", 4000) };
  const on = { record_id, attempt_id, expected_version: version(raw.expected_version) };
  if (action === "evidence") return { ...base(raw), action, ...on, evidence: evidence(raw.evidence) };
  if (action === "remove_evidence") return { ...base(raw), action, ...on, evidence_id: uuid(raw.evidence_id, "evidence_id") };
  if (action === "submit") return { ...base(raw), action, ...on, owner_id: optionalId(raw.owner_id || undefined, "owner_id"), due: optionalDate(raw.due, "due"), severity: choice(raw.severity ?? "Unclassified", "severity", severities) };
  const timezone = optionalText(raw.timezone, "timezone", 64);
  if (timezone) try { new Intl.DateTimeFormat("en-AU", { timeZone: timezone }); } catch { invalid("timezone", "Use an IANA time zone such as Australia/Brisbane."); }
  return { ...base(raw), action, ...on, configuration_reference: optionalText(raw.configuration_reference, "configuration_reference", 200), configuration_source_id: optionalId(raw.configuration_source_id || undefined, "configuration_source_id"),
    occurred_at: raw.occurred_at ? instant(raw.occurred_at, "occurred_at") : null, timezone, clock_concern: optionalText(raw.clock_concern, "clock_concern", 400), prerequisites: prerequisites(raw.prerequisites, true), findings: optionalNarrative(raw.findings, "findings", 4000),
    readings: readings(raw.readings), instrument_ids: list(raw.instrument_ids ?? [], "instrument_ids", 10, (k) => uuid(k, "instrument_ids")) };
}

// ---------------------------------------------------------------------------------------------
export function parseConfigurationCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "record_id", "configuration_id", "item_id", "redline_id", "association_id", "backup_id", "expected_version", "installed_reference", "installed_revision", "intended_source_id", "installed_source_id",
    "item_key", "kind", "component", "scope_key", "critical", "intended_value", "intended_source", "observed_value", "observed_evidence", "observation_verified", "proposed_as_built", "disposition", "disposition_reason", "change_id", "decision_reason",
    "source_id", "location", "description", "evidence", "proposed_correction", "predecessor_id", "decision", "classification", "owner_id", "due", "successor_source_id", "verification_note", "from_reference", "from_asset_id", "to_reference", "to_asset_id",
    "source", "confirmation_method", "effective_from", "concern", "constraint_source", "affected_checks", "review_note", "asset_reference", "asset_id", "purpose", "configuration_version", "native_format", "stored_reference", "content_hash", "captured_at",
    "access_class", "compatibility", "required_stage", "fact"]);
  const action = choice(raw.action, "action", ["snapshot", "item", "dispose", "submit", "reconcile", "redline", "redline_decide", "redline_verify", "association", "association_review", "backup", "backup_verify"] as const), record_id = uuid(raw.record_id, "record_id"),
    head = { ...base(raw), record_id, expected_version: action === "item" ? 1 : version(raw.expected_version) }, affected = () => list(raw.affected_checks ?? [], "affected_checks", 40, (k) => key(k, "affected_checks"));
  // A concern is recorded only with the sourced constraint that makes it one: no universal one-sensor-one-area rule is assumed.
  const concern = () => { const c = optionalText(raw.concern, "concern", 600), s = optionalText(raw.constraint_source, "constraint_source", 300); if (!!c !== !!s) invalid("constraint_source", "A concern names the sourced constraint it rests on."); return { concern: c, constraint_source: s }; };
  switch (action) {
    case "snapshot": return { ...head, action, id: uuid(raw.id, "id"), installed_reference: label(raw.installed_reference, "installed_reference", 80), installed_revision: revision(raw.installed_revision, "installed_revision"), intended_source_id: optionalId(raw.intended_source_id || undefined, "intended_source_id"), installed_source_id: optionalId(raw.installed_source_id || undefined, "installed_source_id") };
    case "item": return { ...head, expected_version: optionalVersion(raw.expected_version), action, id: uuid(raw.id, "id"), configuration_id: uuid(raw.configuration_id, "configuration_id"), item_key: key(raw.item_key, "item_key"), kind: choice(raw.kind, "kind", comparisonKinds), component: label(raw.component, "component", 160), scope_key: optionalKey(raw.scope_key, "scope_key"),
      critical: flag(raw.critical, "critical"), intended_value: optionalText(raw.intended_value, "intended_value", 400), intended_source: optionalText(raw.intended_source, "intended_source", 200), observed_value: optionalText(raw.observed_value, "observed_value", 400),
      observed_evidence: optionalText(raw.observed_evidence, "observed_evidence", 400), observation_verified: flag(raw.observation_verified, "observation_verified"), proposed_as_built: optionalText(raw.proposed_as_built, "proposed_as_built", 400), redline_id: optionalId(raw.redline_id || undefined, "redline_id") };
    case "dispose": return { ...head, action, item_id: uuid(raw.item_id, "item_id"), disposition: choice(raw.disposition, "disposition", differenceDispositions.filter((d) => d !== "Open")), disposition_reason: label(raw.disposition_reason, "disposition_reason", 1000), change_id: optionalId(raw.change_id || undefined, "change_id") };
    case "submit": return { ...head, action, configuration_id: uuid(raw.configuration_id, "configuration_id") };
    case "reconcile": return { ...head, action, configuration_id: uuid(raw.configuration_id, "configuration_id"), decision_reason: narrative(raw.decision_reason, "decision_reason", 2000) };
    case "redline": return { ...head, action, id: uuid(raw.id, "id"), source_id: uuid(raw.source_id, "source_id"), location: label(raw.location, "location", 120), component: label(raw.component, "component", 120), description: narrative(raw.description, "description", 2000),
      evidence: optionalText(raw.evidence, "evidence", 600), proposed_correction: label(raw.proposed_correction, "proposed_correction", 1000), predecessor_id: optionalId(raw.predecessor_id || undefined, "predecessor_id") };
    case "redline_decide": {
      const decision = choice(raw.decision, "decision", ["UnderReview", "ClarificationRequired", "AcceptedForIncorporation", "Rejected"] as const), owned = decision === "ClarificationRequired" || decision === "AcceptedForIncorporation";
      return { ...head, action, redline_id: uuid(raw.redline_id, "redline_id"), decision, decision_reason: narrative(raw.decision_reason, "decision_reason", 2000), classification: optionalChoice(raw.classification, "classification", redlineClasses),
        owner_id: owned ? uuid(raw.owner_id, "owner_id") : null, due: owned ? dateOnly(raw.due, "due") : null, change_id: optionalId(raw.change_id || undefined, "change_id") };
    }
    case "redline_verify": return { ...head, action, redline_id: uuid(raw.redline_id, "redline_id"), successor_source_id: uuid(raw.successor_source_id, "successor_source_id"), verification_note: narrative(raw.verification_note, "verification_note", 2000) };
    case "association": return { ...head, action, id: uuid(raw.id, "id"), kind: choice(raw.kind, "kind", associationKinds), from_reference: label(raw.from_reference, "from_reference", 120), from_asset_id: optionalId(raw.from_asset_id || undefined, "from_asset_id"), to_reference: label(raw.to_reference, "to_reference", 120),
      to_asset_id: optionalId(raw.to_asset_id || undefined, "to_asset_id"), source: label(raw.source, "source", 300), confirmation_method: optionalText(raw.confirmation_method, "confirmation_method", 300), effective_from: instant(raw.effective_from, "effective_from"), predecessor_id: optionalId(raw.predecessor_id || undefined, "predecessor_id"), ...concern(), affected_checks: affected() };
    case "association_review": return { ...head, action, association_id: uuid(raw.association_id, "association_id"), decision: choice(raw.decision, "decision", ["Confirmed", "ReviewRequired"] as const), review_note: label(raw.review_note, "review_note", 1000), confirmation_method: optionalText(raw.confirmation_method, "confirmation_method", 300), ...concern(), affected_checks: affected() };
    case "backup": {
      const hash = optionalText(raw.content_hash, "content_hash", 64);
      if (hash && !/^[a-f0-9]{64}$/.test(hash)) invalid("content_hash", "A content hash is a SHA-256 in lower-case hexadecimal.");
      return { ...head, action, id: uuid(raw.id, "id"), asset_reference: label(raw.asset_reference, "asset_reference", 120), asset_id: optionalId(raw.asset_id || undefined, "asset_id"), purpose: label(raw.purpose, "purpose", 300), configuration_version: label(raw.configuration_version, "configuration_version", 80),
        native_format: label(raw.native_format, "native_format", 60), stored_reference: label(raw.stored_reference, "stored_reference", 300), content_hash: hash, captured_at: instant(raw.captured_at, "captured_at"), access_class: choice(raw.access_class ?? "Restricted", "access_class", ["Internal", "Restricted"] as const),
        compatibility: optionalText(raw.compatibility, "compatibility", 300), required_stage: choice(raw.required_stage ?? "TechnicalIssue", "required_stage", requiredStages) };
    }
    default: return { ...head, action, backup_id: uuid(raw.backup_id, "backup_id"), fact: choice(raw.fact, "fact", ["available", "identity", "restore"] as const), evidence: label(raw.evidence, "evidence", 600) };
  }
}

// ---------------------------------------------------------------------------------------------
export function parseReleaseCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "record_id", "release_id", "output_id", "predecessor_id", "expected_version", "included", "excluded", "audience", "recipients", "decision_reason"]);
  const action = choice(raw.action, "action", ["draft", "save", "submit", "approve", "return", "prepare", "issue", "withdraw"] as const), head = { ...base(raw), ...target(raw) };
  if (action === "draft") return { ...head, action, id: uuid(raw.id, "id"), predecessor_id: optionalId(raw.predecessor_id || undefined, "predecessor_id") };
  const release_id = uuid(raw.release_id, "release_id");
  if (action === "save") {
    // Scope is what the command names, item by item. It is never what a filter, a page or a ticked row happened to show.
    const included = list(raw.included, "included", 60, (k) => key(k, "included")), excluded = list(raw.excluded ?? [], "excluded", 60, (item, i) => { const r = object(item, ["key", "reason", "owner_id", "residual"]); return { key: key(r.key, `excluded-${i}`), reason: label(r.reason, `excluded-${i}`, 600), owner_id: optionalId(r.owner_id || undefined, `excluded-${i}`), residual: optionalText(r.residual, `excluded-${i}`, 600) }; });
    unique([...included, ...excluded.map((e) => e.key)], "included");
    const recipients = list(raw.recipients ?? [], "recipients", 12, (item, i) => { const r = object(item, ["destination", "recipient_id", "purpose"]); return { destination: choice(r.destination, `recipients-${i}`, destinations), recipient_id: uuid(r.recipient_id, `recipients-${i}`), purpose: label(r.purpose, `recipients-${i}`, 300) }; });
    unique(recipients.map((r) => `${r.destination}:${r.recipient_id}`), "recipients");
    // Whether a release is partial is derived from what it holds back. It is never a flag a client sets.
    return { ...head, action, release_id, included, excluded, audience: choice(raw.audience ?? "Internal", "audience", ["Internal", "Customer"] as const), recipients };
  }
  if (action === "prepare") return { ...head, action, release_id, id: uuid(raw.id, "id") };
  if (action === "issue") return { ...head, action, release_id, output_id: uuid(raw.output_id, "output_id") };
  if (action === "submit") return { ...head, action, release_id };
  const decision_reason = narrative(raw.decision_reason, "decision_reason", 2000);
  if (action === "approve") return { ...head, action, release_id, decision_reason };
  if (action === "return") return { ...head, action, release_id, decision_reason };
  return { ...head, action, release_id, decision_reason };
}

// ---------------------------------------------------------------------------------------------
const deliveries = ["Delivered", "Unknown", "Unavailable"] as const;
export function parseHandoverCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "id", "submission_id", "output_id", "record_id", "release_id", "handover_id", "obligation_id", "expected_version", "kind", "title", "required_stage", "subject", "content_revision", "source_reference",
    "owner_id", "due", "state", "planned_on", "delivered_on", "evidence", "competence_note", "disposition_reason", "disposition_authority", "destination", "recipient_id", "purpose", "support_owner_id", "simulate_delivery", "correction_note", "outcome", "outcome_reason"]);
  const action = choice(raw.action, "action", ["obligation", "obligation_state", "request", "resubmit", "reconcile", "decide", "cancel"] as const), record_id = uuid(raw.record_id, "record_id");
  // The local synthetic receiver can be told to answer as unreachable, so that an unknown outcome and its recovery can be shown. It is always labelled.
  const simulate_delivery = choice(raw.simulate_delivery ?? "Delivered", "simulate_delivery", deliveries), outputs = () => ({ output_id: uuid(raw.output_id, "output_id") });
  switch (action) {
    case "obligation": return { ...base(raw), action, record_id, id: uuid(raw.id, "id"), expected_version: optionalVersion(raw.expected_version), kind: choice(raw.kind, "kind", obligationKinds), title: label(raw.title, "title", 200), required_stage: choice(raw.required_stage, "required_stage", requiredStages),
      subject: optionalText(raw.subject, "subject", 300), content_revision: optionalText(raw.content_revision, "content_revision", 40), source_reference: optionalText(raw.source_reference, "source_reference", 300), owner_id: uuid(raw.owner_id, "owner_id"), due: optionalDate(raw.due, "due") };
    case "obligation_state": return { ...base(raw), action, record_id, obligation_id: uuid(raw.obligation_id, "obligation_id"), expected_version: version(raw.expected_version), state: choice(raw.state, "state", obligationStates), planned_on: optionalDate(raw.planned_on, "planned_on"), delivered_on: optionalDate(raw.delivered_on, "delivered_on"),
      evidence: optionalText(raw.evidence, "evidence", 600), competence_note: optionalText(raw.competence_note, "competence_note", 600), disposition_reason: optionalText(raw.disposition_reason, "disposition_reason", 1000), disposition_authority: optionalText(raw.disposition_authority, "disposition_authority", 300) };
    case "request": return { ...base(raw), action, record_id, expected_version: version(raw.expected_version), id: uuid(raw.id, "id"), submission_id: uuid(raw.submission_id, "submission_id"), ...outputs(), release_id: uuid(raw.release_id, "release_id"), destination: choice(raw.destination, "destination", destinations),
      recipient_id: uuid(raw.recipient_id, "recipient_id"), purpose: label(raw.purpose, "purpose", 300), support_owner_id: optionalId(raw.support_owner_id || undefined, "support_owner_id"), due: optionalDate(raw.due, "due"), simulate_delivery };
    case "resubmit": return { ...base(raw), action, record_id, expected_version: version(raw.expected_version), id: uuid(raw.id, "id"), ...outputs(), handover_id: uuid(raw.handover_id, "handover_id"), correction_note: narrative(raw.correction_note, "correction_note", 2000), simulate_delivery };
    case "reconcile": return { ...base(raw), action, record_id, expected_version: version(raw.expected_version), handover_id: uuid(raw.handover_id, "handover_id") };
    case "decide": {
      const outcome = choice(raw.outcome, "outcome", receivingOutcomes), owned = outcome !== "Accepted";
      return { ...base(raw), action, record_id, expected_version: version(raw.expected_version), handover_id: uuid(raw.handover_id, "handover_id"), submission_id: uuid(raw.submission_id, "submission_id"), outcome, outcome_reason: narrative(raw.outcome_reason, "outcome_reason", 2000),
        owner_id: owned ? uuid(raw.owner_id, "owner_id") : null, due: owned ? dateOnly(raw.due, "due") : null };
    }
    default: return { ...base(raw), action, record_id, expected_version: version(raw.expected_version), handover_id: uuid(raw.handover_id, "handover_id") };
  }
}
