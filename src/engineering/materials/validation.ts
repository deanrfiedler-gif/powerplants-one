import { common, commonKeys, object, uuid, label, narrative, optionalNarrative, optionalText, optionalId, dateOnly, version, invalid, choice } from "../../shared/validation";
import { disciplines } from "../model";
import {
  units, mappingConditions, criterionResults, commercialStates, releasePurposes, sourcePurposes, kitRoles,
  demandBases, parseQuantity, formatQuantity, type Criterion, type Selection,
} from "./model";

// Every parser lists the keys it accepts, so a command carrying an approval flag, a hash, a role label
// or a source purpose it was never asked for is refused before any rule runs.
const base = (p: Record<string, unknown>) => common(p);
// A parser that serves several actions first learns the action, then accepts that action's fields and no others:
// a field that belongs to a sibling action is refused, not quietly ignored.
function actionOf<T extends string>(value: unknown, actions: Record<T, readonly string[]>): { raw: Record<string, unknown>; action: T } {
  const names = Object.keys(actions) as T[], all = [...commonKeys, "action", ...new Set(names.flatMap((n) => actions[n]))];
  const raw = object(value, all), chosen = choice(raw.action, "action", names), allowed = [...commonKeys, "action", ...actions[chosen]];
  for (const key of Object.keys(raw)) if (!allowed.includes(key)) invalid(key, `This field is not part of the "${chosen}" action.`);
  return { raw, action: chosen };
}
function optionalDate(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  const date = dateOnly(value, field);
  if (date < "0001-01-01" || date > "9998-12-31") invalid(field, "Enter a date between years 0001 and 9998.");
  return date;
}
export function quantity(value: unknown, field: string): string {
  const parsed = typeof value === "string" ? parseQuantity(value.trim()) : null;
  if (parsed === null || parsed <= 0n) return invalid(field, "Enter a quantity above zero as a decimal string with up to six decimal places, for example 12 or 120.5.");
  return formatQuantity(parsed);
}
function flag(value: unknown, field: string, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") invalid(field, "Choose yes or no.");
  return value as boolean;
}
function wholeNumber(value: unknown, field: string, min: number, max: number) {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) invalid(field, `Enter a whole number from ${min} to ${max}.`);
  return Number(value);
}
function list<T>(value: unknown, field: string, max: number, read: (item: unknown, i: number) => T, min = 0): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) return invalid(field, `Provide ${min} to ${max} entries.`);
  return value.map(read);
}

export function parseSetCommand(value: unknown) {
  const { raw, action } = actionOf(value, { create: ["id", "set_code", "revision", "title"], revise: ["set_id", "expected_version"] });
  if (action === "create")
    return { ...base(raw), action, id: uuid(raw.id, "id"), set_code: label(raw.set_code, "set_code", 2).toUpperCase(), revision: wholeNumber(raw.revision ?? 1, "revision", 1, 999), title: label(raw.title, "title", 200) };
  return { ...base(raw), action, set_id: uuid(raw.set_id, "set_id"), expected_version: version(raw.expected_version) };
}

export function parseSourceCommand(value: unknown) {
  const { raw, action } = actionOf(value, { publish: ["id", "kind", "reference", "title", "revision", "file_version", "permitted_purpose", "content", "restricted", "supersedes_id"], withdraw: ["source_id"] });
  if (action === "withdraw") return { ...base(raw), action, source_id: uuid(raw.source_id, "source_id") };
  const revision = label(raw.revision, "revision", 12);
  if (!/^[A-Za-z0-9.]{1,12}$/.test(revision)) invalid("revision", "Use letters, digits and full stops only.");
  return {
    ...base(raw), action, id: uuid(raw.id, "id"),
    kind: choice(raw.kind, "kind", ["DesignBasis", "DrawingIssue", "CompatibilityEvidence", "DemandAuthority", "CommercialDecision", "TestProcedure", "TestEvidence", "InstalledConfiguration"] as const),
    reference: label(raw.reference, "reference", 80), title: label(raw.title, "title", 200), revision,
    file_version: label(raw.file_version, "file_version", 40),
    permitted_purpose: choice(raw.permitted_purpose, "permitted_purpose", sourcePurposes),
    // null content records an upstream document that could not be retrieved: observed, but unavailable.
    content: optionalNarrative(raw.content, "content", 20000), restricted: flag(raw.restricted, "restricted"),
    supersedes_id: optionalId(raw.supersedes_id, "supersedes_id"),
  };
}

const lineKeys = [
  "line_id", "expected_version", "set_id", "line_number", "description", "category", "specification", "discipline", "system_name", "location",
  "served_areas", "quantity", "unit", "quantity_basis", "required_by", "purpose", "manufacturer", "model", "supplier_part", "product_ref",
  "kit_role", "parent_line_id", "dependency_group", "drawing_source_id", "basis_source_id", "scope_decision_needed", "scope_decision_owner_id",
  "next_owner_id", "next_action", "action_due",
];
const bindingKeys = [
  "line_id", "expected_version", "mapping", "mapping_configuration", "mapping_entity", "mapping_item_key", "mapping_item_description",
  "mapping_candidates", "mapping_rationale", "mapping_owner_id", "target_unit", "conversion_numerator", "conversion_denominator",
  "whole_units_only", "target_precision", "conversion_evidence", "overage_basis",
];
export function parseLineCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", ...new Set([...lineKeys, ...bindingKeys, "removed_reason"])]);
  const action = choice(raw.action, "action", ["save", "binding", "remove"] as const);
  if (action === "remove")
    return { ...base(raw), action, line_id: uuid(raw.line_id, "line_id"), expected_version: version(raw.expected_version), removed_reason: label(raw.removed_reason, "removed_reason", 1000) };
  if (action === "binding") {
    for (const key of Object.keys(raw)) if (![...commonKeys, "action", ...bindingKeys].includes(key)) invalid(key, "This field is not part of an item and unit binding.");
    const numerator = raw.conversion_numerator === null || raw.conversion_numerator === undefined ? null : wholeNumber(raw.conversion_numerator, "conversion_numerator", 1, 999999999),
      denominator = raw.conversion_denominator === null || raw.conversion_denominator === undefined ? null : wholeNumber(raw.conversion_denominator, "conversion_denominator", 1, 999999999);
    if ((numerator === null) !== (denominator === null)) invalid("conversion_denominator", "A conversion factor needs both parts, for example 4 EA per 1 PACK.");
    return {
      ...base(raw), action, line_id: uuid(raw.line_id, "line_id"), expected_version: version(raw.expected_version),
      mapping: choice(raw.mapping, "mapping", mappingConditions),
      mapping_configuration: optionalText(raw.mapping_configuration, "mapping_configuration", 80),
      mapping_entity: optionalText(raw.mapping_entity, "mapping_entity", 80),
      mapping_item_key: optionalText(raw.mapping_item_key, "mapping_item_key", 80),
      mapping_item_description: optionalText(raw.mapping_item_description, "mapping_item_description", 200),
      mapping_candidates: list(raw.mapping_candidates ?? [], "mapping_candidates", 8, (item, i) => {
        const c = object(item, ["item_key", "description", "discriminator"]);
        return { item_key: label(c.item_key, `mapping_candidates-${i}`, 80), description: label(c.description, `mapping_candidates-${i}`, 200), discriminator: label(c.discriminator, `mapping_candidates-${i}`, 300) };
      }),
      mapping_rationale: optionalText(raw.mapping_rationale, "mapping_rationale", 1000),
      mapping_owner_id: optionalId(raw.mapping_owner_id, "mapping_owner_id"),
      target_unit: raw.target_unit === null || raw.target_unit === undefined ? null : choice(raw.target_unit, "target_unit", units),
      conversion_numerator: numerator, conversion_denominator: denominator,
      whole_units_only: flag(raw.whole_units_only, "whole_units_only"),
      target_precision: wholeNumber(raw.target_precision ?? 6, "target_precision", 0, 6),
      conversion_evidence: optionalText(raw.conversion_evidence, "conversion_evidence", 1000),
      overage_basis: optionalText(raw.overage_basis, "overage_basis", 1000),
    };
  }
  for (const key of Object.keys(raw)) if (![...commonKeys, "action", ...lineKeys].includes(key)) invalid(key, "Item mapping is saved from Item & unit mapping, not with the requirement.");
  const kit_role = choice(raw.kit_role ?? "Independent", "kit_role", kitRoles),
    parent_line_id = optionalId(raw.parent_line_id, "parent_line_id");
  if ((kit_role === "KitChild") !== !!parent_line_id) invalid("parent_line_id", "Kit content names the kit line it belongs to; other lines name none.");
  const line_number = label(raw.line_number, "line_number", 4);
  if (!/^[0-9]{3,4}$/.test(line_number)) invalid("line_number", "Use a three or four digit line number, for example 030.");
  const scope_decision_needed = flag(raw.scope_decision_needed, "scope_decision_needed"),
    scope_decision_owner_id = optionalId(raw.scope_decision_owner_id, "scope_decision_owner_id");
  if (scope_decision_needed && !scope_decision_owner_id) invalid("scope_decision_owner_id", "Name who owns the outstanding scope decision.");
  return {
    ...base(raw), action,
    line_id: uuid(raw.line_id, "line_id"),
    expected_version: raw.expected_version === undefined || raw.expected_version === null ? null : version(raw.expected_version),
    set_id: uuid(raw.set_id, "set_id"), line_number,
    description: label(raw.description, "description", 200), category: label(raw.category, "category", 80),
    specification: narrative(raw.specification, "specification", 2000), discipline: choice(raw.discipline, "discipline", disciplines),
    system_name: label(raw.system_name, "system_name", 120), location: label(raw.location, "location", 120),
    served_areas: list(raw.served_areas ?? [], "served_areas", 20, (item, i) => label(item, `served_areas-${i}`, 120)),
    quantity: quantity(raw.quantity, "quantity"), unit: choice(raw.unit, "unit", units),
    quantity_basis: label(raw.quantity_basis, "quantity_basis", 400),
    required_by: optionalDate(raw.required_by, "required_by"), purpose: choice(raw.purpose, "purpose", releasePurposes),
    manufacturer: optionalText(raw.manufacturer, "manufacturer", 120), model: optionalText(raw.model, "model", 120),
    supplier_part: optionalText(raw.supplier_part, "supplier_part", 120), product_ref: optionalText(raw.product_ref, "product_ref", 120),
    kit_role, parent_line_id, dependency_group: optionalText(raw.dependency_group, "dependency_group", 80),
    drawing_source_id: optionalId(raw.drawing_source_id, "drawing_source_id"), basis_source_id: optionalId(raw.basis_source_id, "basis_source_id"),
    scope_decision_needed, scope_decision_owner_id: scope_decision_needed ? scope_decision_owner_id : null,
    next_owner_id: uuid(raw.next_owner_id, "next_owner_id"), next_action: label(raw.next_action, "next_action", 300),
    action_due: optionalDate(raw.action_due, "action_due"),
  };
}

function criteria(value: unknown): Criterion[] {
  const seen = new Set<string>();
  return list(value, "criteria", 20, (item, i) => {
    const c = object(item, ["key", "label", "mandatory", "result", "note", "evidence"]),
      key = label(c.key, `criteria-${i}`, 40);
    if (seen.has(key)) invalid(`criteria-${i}`, "Each criterion appears once.");
    seen.add(key);
    if (typeof c.mandatory !== "boolean") invalid(`criteria-${i}`, "State whether the criterion is mandatory.");
    return { key, label: label(c.label, `criteria-${i}`, 120), mandatory: c.mandatory as boolean, result: choice(c.result, `criteria-${i}`, criterionResults), note: optionalText(c.note, `criteria-${i}`, 600), evidence: optionalText(c.evidence, `criteria-${i}`, 300) };
  }, 1);
}
export function parseSubstitutionCommand(value: unknown) {
  const contentKeys = ["candidate_code", "candidate_description", "candidate_manufacturer", "candidate_revision", "candidate_item_key", "proposal_reason", "scope_quantity", "criteria", "impacts", "commercial_state", "commercial_owner_id"],
    targetKeys = ["substitution_id", "expected_version"];
  const { raw, action } = actionOf(value, {
    propose: ["id", "line_id", ...contentKeys], update: [...targetKeys, ...contentKeys], submit: targetKeys, decide: [...targetKeys, "result", "rationale", "owner_id", "due"],
    successor: ["id", ...targetKeys], adopt: targetKeys, commercial: [...targetKeys, "commercial_state", "commercial_note", "commercial_source_id"],
  });
  const target = () => ({ substitution_id: uuid(raw.substitution_id, "substitution_id"), expected_version: version(raw.expected_version) });
  const content = () => ({
    candidate_code: label(raw.candidate_code, "candidate_code", 80), candidate_description: label(raw.candidate_description, "candidate_description", 200),
    candidate_manufacturer: label(raw.candidate_manufacturer, "candidate_manufacturer", 120), candidate_revision: label(raw.candidate_revision, "candidate_revision", 40),
    candidate_item_key: optionalText(raw.candidate_item_key, "candidate_item_key", 80),
    proposal_reason: label(raw.proposal_reason, "proposal_reason", 1000), scope_quantity: quantity(raw.scope_quantity, "scope_quantity"),
    criteria: criteria(raw.criteria),
    impacts: list(raw.impacts ?? [], "impacts", 12, (item, i) => {
      const x = object(item, ["area", "effect", "owner"]);
      return { area: label(x.area, `impacts-${i}`, 120), effect: label(x.effect, `impacts-${i}`, 400), owner: label(x.owner, `impacts-${i}`, 120) };
    }),
    // Whether a commercial question exists at all belongs to the commercial owner: the author may only say "not assessed" or "decision needed".
    commercial_state: choice(raw.commercial_state ?? "NotAssessed", "commercial_state", ["NotAssessed", "DecisionNeeded"] as const),
    commercial_owner_id: optionalId(raw.commercial_owner_id, "commercial_owner_id"),
  });
  if (action === "propose") return { ...base(raw), action, id: uuid(raw.id, "id"), line_id: uuid(raw.line_id, "line_id"), ...content() };
  if (action === "update") return { ...base(raw), action, ...target(), ...content() };
  if (action === "successor") return { ...base(raw), action, id: uuid(raw.id, "id"), ...target() };
  if (action === "decide") {
    const result = choice(raw.result, "result", ["Accepted", "Returned", "Held", "Rejected"] as const),
      owner_id = optionalId(raw.owner_id, "owner_id"), due = optionalDate(raw.due, "due");
    if (["Returned", "Held"].includes(result) && (!owner_id || !due)) invalid("owner_id", "A return or hold names who acts next and by when.");
    return { ...base(raw), action, ...target(), result, rationale: narrative(raw.rationale, "rationale", 2000), owner_id, due };
  }
  if (action === "commercial")
    return { ...base(raw), action, ...target(), commercial_state: choice(raw.commercial_state, "commercial_state", commercialStates.filter((s) => s === "Decided" || s === "NoEffectConfirmed")), commercial_note: label(raw.commercial_note, "commercial_note", 1000), commercial_source_id: optionalId(raw.commercial_source_id, "commercial_source_id") };
  return { ...base(raw), action, ...target() };
}

export function selection(value: unknown): Selection[] {
  return list(value, "selection", 200, (item, i) => {
    const s = object(item, ["line_id", "quantity"]);
    return { line_id: uuid(s.line_id, `selection-${i}`), quantity: quantity(s.quantity, `selection-${i}`) };
  }, 1);
}
export function parseReleaseCommand(value: unknown) {
  const releaseTarget = ["release_id", "expected_version"];
  const { raw, action } = actionOf(value, { prepare: ["id", "set_id", "purpose", "audience", "selection", "predecessor_id"], submit: releaseTarget, review: [...releaseTarget, "result", "rationale", "owner_id", "due"], authorise: releaseTarget, issue: releaseTarget, cancel: releaseTarget, withdraw: releaseTarget });
  if (action === "prepare")
    return { ...base(raw), action, id: uuid(raw.id, "id"), set_id: uuid(raw.set_id, "set_id"), purpose: choice(raw.purpose, "purpose", releasePurposes), audience: label(raw.audience, "audience", 200), selection: selection(raw.selection), predecessor_id: optionalId(raw.predecessor_id, "predecessor_id") };
  const target = { release_id: uuid(raw.release_id, "release_id"), expected_version: version(raw.expected_version) };
  if (action === "review") {
    const result = choice(raw.result, "result", ["Accepted", "Returned", "Held"] as const),
      owner_id = optionalId(raw.owner_id, "owner_id"), due = optionalDate(raw.due, "due");
    if (result !== "Accepted" && (!owner_id || !due)) invalid("owner_id", "A return or hold names who acts next and by when.");
    return { ...base(raw), action, ...target, result, rationale: narrative(raw.rationale, "rationale", 2000), owner_id, due };
  }
  return { ...base(raw), action, ...target };
}

export function parseHandoverCommand(value: unknown) {
  const handoverTarget = ["handover_id", "expected_version"];
  const { raw, action } = actionOf(value, { prepare: ["id", "release_id", "requested_action", "demand_basis", "demand_source_id", "receiver_id", "required_by", "predecessor_id"], send: handoverTarget, decide: [...handoverTarget, "result", "reasons", "owner_id", "due"] });
  if (action === "prepare") {
    const demand_basis = choice(raw.demand_basis, "demand_basis", demandBases),
      demand_source_id = optionalId(raw.demand_source_id, "demand_source_id"),
      requested_action = choice(raw.requested_action, "requested_action", ["ProcurementReady", "ForecastOnly"] as const);
    if ((demand_basis === "Approved") !== !!demand_source_id) invalid("demand_source_id", "Approved demand names its authority evidence; forecast demand names none.");
    if (requested_action === "ProcurementReady" && demand_basis !== "Approved") invalid("demand_basis", "A technical release does not turn forecast into approved demand. Procurement-ready receiving needs separately evidenced approved demand.");
    return { ...base(raw), action, id: uuid(raw.id, "id"), release_id: uuid(raw.release_id, "release_id"), requested_action, demand_basis, demand_source_id, receiver_id: uuid(raw.receiver_id, "receiver_id"), required_by: optionalDate(raw.required_by, "required_by"), predecessor_id: optionalId(raw.predecessor_id, "predecessor_id") };
  }
  const target = { handover_id: uuid(raw.handover_id, "handover_id"), expected_version: version(raw.expected_version) };
  if (action === "send") return { ...base(raw), action, ...target };
  const result = choice(raw.result, "result", ["Accepted", "Returned"] as const),
    reasons = list(raw.reasons ?? [], "reasons", 40, (item, i) => {
      const r = object(item, ["line_id", "reason"]);
      return { line_id: optionalId(r.line_id, `reasons-${i}`), reason: label(r.reason, `reasons-${i}`, 600) };
    }),
    owner_id = optionalId(raw.owner_id, "owner_id"), due = optionalDate(raw.due, "due");
  if (result === "Returned" && (!reasons.length || !owner_id || !due)) invalid("reasons", "A return gives at least one reason, who corrects it and by when.");
  if (result === "Accepted" && (reasons.length || owner_id || due)) invalid("reasons", "Acceptance is of the whole exact payload and carries no return details.");
  return { ...base(raw), action, ...target, result, reasons, owner_id, due };
}

export function parseImpactCommand(value: unknown) {
  const raw = object(value, [...commonKeys, "action", "impact_id", "expected_version", "resolution"]);
  choice(raw.action, "action", ["resolve"] as const);
  return { ...base(raw), action: "resolve" as const, impact_id: uuid(raw.impact_id, "impact_id"), expected_version: version(raw.expected_version), resolution: narrative(raw.resolution, "resolution", 2000) };
}
