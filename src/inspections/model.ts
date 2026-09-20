// The shared inspection core (adopted F02; first consumer EN-08, later FI-03/FI-04). Types and pure rules only:
// nothing here reads a database, a clock or a browser, so the same rule decides a screen label, a server
// refusal and a unit test. An inspection is hosted by a typed business context. It never invents one: a
// Project commissioning scope and a Service appointment are different hosts with different authority, and a
// dummy appointment is never created to satisfy a project test. Every limit in this prototype is fictional.

export const hostTypes = ["ProjectCommissioningScope", "ServiceAppointment"] as const;
export type HostType = (typeof hostTypes)[number];
export type Host = { host_type: HostType; host_id: string };

// ---------------------------------------------------------------------------------------------
// Four independent dimensions (build plan r02, section 8.2). A numerically passing attempt can be returned
// for missing evidence; an accepted historic attempt may not apply to a later configuration.
export const evaluations = ["Pass", "Fail", "NotTested", "NotApplicable", "UnableToAssess"] as const;
export type Evaluation = (typeof evaluations)[number];
export const reviewStates = ["NotSubmitted", "InReview", "Accepted", "Returned", "ClarificationRequired", "OnHold"] as const;
export type ReviewState = (typeof reviewStates)[number];
export const reviewDecisions = ["Accepted", "Returned", "ClarificationRequired", "OnHold"] as const;
export type ReviewDecision = (typeof reviewDecisions)[number];
export const applicabilities = ["Current", "ReassessmentRequired", "Unavailable", "HistoricalOnly"] as const;
export type Applicability = (typeof applicabilities)[number];

// ---------------------------------------------------------------------------------------------
// Check definitions. A definition is one stable occurrence: the same named check on two assets is two
// occurrences with two keys. A missing criterion stays missing: nothing borrows a threshold from another
// asset, manufacturer or template, and nothing defaults to a pass.
export const checkTypes = ["Numeric", "Qualitative"] as const;
export type CheckType = (typeof checkTypes)[number];
export type NumericCriterion = {
  unit: string; precision: number;
  lower: string | null; lower_inclusive: boolean; upper: string | null; upper_inclusive: boolean;
  // Approved conversions only: value_in_criterion_unit = value * multiply + add. No conversion is ever assumed.
  conversions: { from_unit: string; multiply: string; add: string }[];
};
export type QualitativeCriterion = { choices: string[]; accepted: string[] };
export const conditionOutcomes = ["True", "False", "Unknown"] as const;
export type ConditionOutcome = (typeof conditionOutcomes)[number];
export const witnessKinds = ["None", "Witness", "Hold"] as const;
export type CheckDefinition = {
  key: string; name: string; check_type: CheckType; required: boolean; scope_key: string | null;
  numeric: NumericCriterion | null; qualitative: QualitativeCriterion | null;
  // A versioned condition. False removes the requirement with its recorded reason; Unknown never does.
  condition: { statement: string; outcome: ConditionOutcome } | null;
  evidence_min: number; instrument_required: boolean; witness: (typeof witnessKinds)[number];
  criterion_source_id: string | null;
};
export const hasCriterion = (d: CheckDefinition) => (d.check_type === "Numeric" ? !!d.numeric && (d.numeric.lower !== null || d.numeric.upper !== null) : !!d.qualitative && d.qualitative.accepted.length > 0);
export const isRequired = (d: CheckDefinition) => d.required && d.condition?.outcome !== "False";

export const readingStates = ["Recorded", "NotTested", "NotApplicable"] as const;
export type Reading = {
  check_key: string; state: (typeof readingStates)[number]; value: string | null; unit: string | null; choice: string | null;
  reason: string | null; note: string | null; evidence_ids: string[];
};

// Exact decimals on integer arithmetic, twelve fractional places. Display rounding can never change an
// evaluation because the evaluation never sees a rounded number.
const scale = 12, unitScale = 10n ** BigInt(scale);
export function parseDecimal(value: string): bigint | null {
  const m = /^(-?)(\d{1,15})(?:\.(\d{1,12}))?$/.exec(value.trim());
  if (!m) return null;
  const n = BigInt(m[2]) * unitScale + BigInt((m[3] ?? "").padEnd(scale, "0"));
  return m[1] ? -n : n;
}
export const decimalPlaces = (value: string) => (/\.(\d+)$/.exec(value.trim())?.[1].length ?? 0);
const multiply = (a: bigint, b: bigint) => {
  const product = a * b, quotient = product / unitScale, remainder = product % unitScale;
  // A conversion that cannot be represented exactly is not applied: it is reported, never rounded.
  return remainder === 0n ? quotient : null;
};
export type Evaluated = { evaluation: Evaluation; reason: string | null; compared: string | null };
export function evaluate(d: CheckDefinition, r: Reading | undefined): Evaluated {
  const out = (evaluation: Evaluation, reason: string | null = null, compared: string | null = null): Evaluated => ({ evaluation, reason, compared });
  if (d.condition?.outcome === "False") return out("NotApplicable", `Condition not met: ${d.condition.statement}`);
  if (!r || r.state === "NotTested") return out("NotTested", r?.reason ?? null);
  // "Not applicable" exists only where the approved basis says so. It is never a way to take a failed check out of the count.
  if (r.state === "NotApplicable") return out("UnableToAssess", "Not applicable was entered, but the approved basis has no condition that removes this check.");
  if (!hasCriterion(d)) return out("UnableToAssess", "Criteria missing: the approved basis defines no acceptance criterion for this check. The reading is retained as captured.");
  if (d.check_type === "Qualitative") {
    const q = d.qualitative!;
    if (r.choice === null || !q.choices.includes(r.choice)) return out("UnableToAssess", "The recorded choice is not one of the approved choices.");
    return q.accepted.includes(r.choice) ? out("Pass", null, r.choice) : out("Fail", `“${r.choice}” is not an accepted outcome.`, r.choice);
  }
  const n = d.numeric!, raw = r.value === null ? null : parseDecimal(r.value);
  if (raw === null || !r.unit) return out("UnableToAssess", "No numeric reading with a unit was recorded.");
  let value: bigint | null = raw;
  if (r.unit !== n.unit) {
    const rule = n.conversions.find((c) => c.from_unit === r.unit), factor = rule ? parseDecimal(rule.multiply) : null, offset = rule ? parseDecimal(rule.add) : null;
    if (!rule || factor === null || offset === null) return out("UnableToAssess", `The reading is in ${r.unit}; the criterion is in ${n.unit} and no approved conversion exists.`);
    const converted = multiply(raw, factor);
    value = converted === null ? null : converted + offset;
    if (value === null) return out("UnableToAssess", `The approved conversion from ${r.unit} does not give an exact ${n.unit} value.`);
  }
  const compared = `${formatDecimal(value)} ${n.unit}`, lower = n.lower === null ? null : parseDecimal(n.lower), upper = n.upper === null ? null : parseDecimal(n.upper);
  if (lower !== null && (n.lower_inclusive ? value < lower : value <= lower)) return out("Fail", `Below the ${n.lower_inclusive ? "inclusive" : "exclusive"} lower limit of ${n.lower} ${n.unit}.`, compared);
  if (upper !== null && (n.upper_inclusive ? value > upper : value >= upper)) return out("Fail", `Above the ${n.upper_inclusive ? "inclusive" : "exclusive"} upper limit of ${n.upper} ${n.unit}.`, compared);
  return out("Pass", null, compared);
}
export function formatDecimal(value: bigint): string {
  const sign = value < 0n ? "-" : "", abs = value < 0n ? -value : value, fraction = (abs % unitScale).toString().padStart(scale, "0").replace(/0+$/, "");
  return `${sign}${abs / unitScale}${fraction ? `.${fraction}` : ""}`;
}
export const criterionText = (d: CheckDefinition): string => {
  if (!hasCriterion(d)) return "Criteria missing";
  if (d.check_type === "Qualitative") return `Accepted: ${d.qualitative!.accepted.join(", ")}`;
  const n = d.numeric!, lower = n.lower === null ? null : `${n.lower_inclusive ? "≥" : ">"} ${n.lower}`, upper = n.upper === null ? null : `${n.upper_inclusive ? "≤" : "<"} ${n.upper}`;
  return `${[lower, upper].filter(Boolean).join(" and ")} ${n.unit}`;
};
// What a reading must satisfy before it is saved at all. Evaluation is separate and never refuses a capture.
export function readingProblems(d: CheckDefinition, r: Reading): string[] {
  const out: string[] = [];
  if (r.state === "NotApplicable" && d.condition?.outcome !== "False") out.push(`${d.name}: “not applicable” needs an approved condition in the test basis. Record “not tested” with its reason instead.`);
  if (r.state === "NotTested" && !r.reason?.trim()) out.push(`${d.name}: say why this check was not tested.`);
  if (r.state !== "Recorded") return out;
  if (d.check_type === "Numeric") {
    if (r.value === null || parseDecimal(r.value) === null) out.push(`${d.name}: enter the reading as a plain decimal number.`);
    else if (d.numeric && decimalPlaces(r.value) > d.numeric.precision) out.push(`${d.name}: the basis accepts ${d.numeric.precision} decimal place${d.numeric.precision === 1 ? "" : "s"}. Record what the instrument showed; do not pad or round it here.`);
    if (!r.unit?.trim()) out.push(`${d.name}: a reading needs its unit.`);
  } else if (d.qualitative && (r.choice === null || !d.qualitative.choices.includes(r.choice))) out.push(`${d.name}: choose one of the approved outcomes.`);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Instruments are assessed at the time of the test. A certificate that expired later does not reach back
// and spoil a valid test; a withdrawal that covers the test time does; and an instrument that was invalid
// when used is not repaired by a certificate renewed afterwards.
export type Calibration = { reference: string; version: string; valid_from: string; valid_to: string; withdrawn_effective_from: string | null; withdrawn_reason: string | null };
export const instrumentAssessments = ["ValidAtUse", "InvalidAtUse", "WithdrawnForUse", "Unknown"] as const;
export type InstrumentAssessment = (typeof instrumentAssessments)[number];
export function assessInstrument(calibration: Calibration | null, occurredOn: string): { assessment: InstrumentAssessment; reason: string | null } {
  if (!calibration) return { assessment: "Unknown", reason: "No calibration record is retained for this instrument." };
  if (occurredOn < calibration.valid_from || occurredOn > calibration.valid_to) return { assessment: "InvalidAtUse", reason: `Calibration ${calibration.reference} covers ${calibration.valid_from} to ${calibration.valid_to}; the test was on ${occurredOn}.` };
  if (calibration.withdrawn_effective_from && occurredOn >= calibration.withdrawn_effective_from) return { assessment: "WithdrawnForUse", reason: `Calibration ${calibration.reference} was withdrawn with effect from ${calibration.withdrawn_effective_from}: ${calibration.withdrawn_reason ?? "no reason given"}.` };
  return { assessment: "ValidAtUse", reason: null };
}
export const instrumentExpiredToday = (calibration: Calibration | null, today: string) => !!calibration && today > calibration.valid_to;

// ---------------------------------------------------------------------------------------------
// Submission. An attempt is frozen with its evidence manifest; what stops it is said precisely, and the
// draft is never lost because a submission was refused.
export const evidenceStates = ["Complete", "Pending", "Missing", "Unsupported", "Restricted"] as const;
export type EvidenceState = (typeof evidenceStates)[number];
export type EvidenceItem = { id: string; check_key: string | null; state: EvidenceState; label: string };
export type Prerequisite = { key: string; label: string; kind: "Access" | "Isolation" | "Competency" | "Biosecurity" | "Crop" | "Instrument" | "Witness" | "Hold"; mandatory: boolean; met: boolean; source: string | null };
export type AttemptDraft = {
  readings: Reading[]; evidence: EvidenceItem[]; prerequisites: Prerequisite[];
  instruments: { reference: string; assessment: InstrumentAssessment; reason: string | null }[];
  occurred_at: string | null; configuration_reference: string | null;
};
export function submissionBlockers(definitions: CheckDefinition[], scopeKeys: ReadonlySet<string> | null, a: AttemptDraft): string[] {
  const out: string[] = [], inScope = definitions.filter((d) => isRequired(d) && (!scopeKeys || d.scope_key === null || scopeKeys.has(d.scope_key))), byKey = new Map(a.readings.map((r) => [r.check_key, r]));
  if (!a.occurred_at) out.push("Record when the test actually took place. The time this form is saved is not the time of the test.");
  if (!a.configuration_reference?.trim()) out.push("Name the exact configuration that was tested.");
  for (const p of a.prerequisites) if (p.mandatory && !p.met) out.push(`${p.label}: this ${p.kind === "Hold" ? "hold point" : p.kind === "Witness" ? "witness point" : "prerequisite"} is mandatory and is not met. There is no general override.`);
  for (const d of inScope) {
    const r = byKey.get(d.key);
    if (!r) { out.push(`${d.name}: no entry. Record the reading, or “not tested” with its reason.`); continue; }
    out.push(...readingProblems(d, r));
    const complete = a.evidence.filter((e) => e.check_key === d.key && e.state === "Complete").length;
    if (r.state === "Recorded" && complete < d.evidence_min) out.push(`${d.name}: ${d.evidence_min} item${d.evidence_min === 1 ? "" : "s"} of evidence required, ${complete} complete.`);
    if (r.state === "Recorded" && d.instrument_required && !a.instruments.length) out.push(`${d.name}: name the instrument that was used.`);
  }
  for (const e of a.evidence) if (e.state !== "Complete") out.push(`${e.label}: evidence is ${e.state.toLowerCase()}. ${e.state === "Pending" ? "Wait for the upload to finish" : e.state === "Restricted" ? "It cannot be read with your access" : "Replace or remove it"} before submitting.`);
  for (const i of a.instruments) if (i.assessment === "InvalidAtUse" || i.assessment === "WithdrawnForUse") out.push(`${i.reference}: ${i.reason} A result cannot be submitted on this instrument.`);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Coverage of one scope, from the latest effective result of every required occurrence. Counts, never a
// percentage: a single figure could hide an omission.
export type EffectiveResult = { check_key: string; evaluation: Evaluation; review: ReviewState; applicability: Applicability };
export type Coverage = { required: number; accepted: number; passed_unreviewed: number; failed: number; not_tested: number; unassessable: number; reassessment: number; criteria_missing: number };
export function coverage(definitions: CheckDefinition[], results: EffectiveResult[], scopeKeys: ReadonlySet<string> | null = null): Coverage {
  const byKey = new Map(results.map((r) => [r.check_key, r])), c: Coverage = { required: 0, accepted: 0, passed_unreviewed: 0, failed: 0, not_tested: 0, unassessable: 0, reassessment: 0, criteria_missing: 0 };
  for (const d of definitions) {
    if (!isRequired(d) || (scopeKeys && d.scope_key !== null && !scopeKeys.has(d.scope_key))) continue;
    c.required++;
    if (!hasCriterion(d)) c.criteria_missing++;
    const r = byKey.get(d.key);
    if (!r || r.evaluation === "NotTested") c.not_tested++;
    else if (r.evaluation === "UnableToAssess" || r.evaluation === "NotApplicable") c.unassessable++;
    else if (r.evaluation === "Fail") c.failed++;
    else if (r.applicability !== "Current") c.reassessment++;
    else if (r.review === "Accepted") c.accepted++;
    else c.passed_unreviewed++;
  }
  return c;
}
export const coverageComplete = (c: Coverage) => c.required > 0 && c.accepted === c.required;

// ---------------------------------------------------------------------------------------------
// Defects. One unresolved defect per check occurrence of one host: a repeated failure and a repeated
// command both land on it. It closes only on a fresh passing result that an independent reviewer accepted.
export const defectStates = ["Open", "CorrectionRecorded", "Closed"] as const;
export type DefectState = (typeof defectStates)[number];
export const defectKey = (host: Host, checkKey: string) => `${host.host_type}:${host.host_id}:${checkKey}`;
export function defectClosable(d: { check_key: string }, attempt: { review: ReviewState; results: { check_key: string; evaluation: Evaluation }[]; predecessor_has_defect: boolean }): string | null {
  const result = attempt.results.find((r) => r.check_key === d.check_key);
  if (!result) return "This attempt did not retest the failed check.";
  if (result.evaluation !== "Pass") return "The retest of this check did not pass.";
  if (attempt.review !== "Accepted") return "A passing retest closes a defect only once its evidence is accepted in review.";
  return null;
}

const labels: Record<string, string> = {
  NotTested: "Not tested", NotApplicable: "Not applicable", UnableToAssess: "Unable to assess", NotSubmitted: "Not submitted", InReview: "In review",
  ClarificationRequired: "Clarification required", OnHold: "On hold", ReassessmentRequired: "Reassessment required", HistoricalOnly: "Historical only",
  ProjectCommissioningScope: "Project commissioning scope", ServiceAppointment: "Service appointment", CorrectionRecorded: "Correction recorded",
  ValidAtUse: "Valid when used", InvalidAtUse: "Not valid when used", WithdrawnForUse: "Withdrawn for the test date",
};
export const inspectionLabel = (value: string) => labels[value] ?? value.replace(/([a-z])([A-Z])/g, "$1 $2");
