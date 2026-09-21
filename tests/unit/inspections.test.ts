import assert from "node:assert/strict";
import test from "node:test";
import {
  assessInstrument, coverage, coverageComplete, criterionText, defectClosable, defectKey, evaluate, hasCriterion, instrumentExpiredToday, isRequired, parseDecimal, readingProblems, submissionBlockers,
  type AttemptDraft, type Calibration, type CheckDefinition, type EffectiveResult, type Reading,
} from "../../src/inspections/model";

// The shared inspection core's pure rules (EN-08 is its first consumer). Task-local labels EN08-nn (build plan r02);
// none is a parent acceptance pass. Every limit here is fictional.
const numeric = (over: Partial<NonNullable<CheckDefinition["numeric"]>> = {}, rest: Partial<CheckDefinition> = {}): CheckDefinition => ({
  key: "pressure", name: "SYN holding pressure", check_type: "Numeric", required: true, scope_key: null, qualitative: null, condition: null, evidence_min: 0, instrument_required: false, witness: "None", criterion_source_id: null,
  numeric: { unit: "kPa", precision: 1, lower: "180.0", lower_inclusive: true, upper: "260.0", upper_inclusive: true, conversions: [{ from_unit: "bar", multiply: "100", add: "0" }], ...over }, ...rest,
});
const qualitative = (rest: Partial<CheckDefinition> = {}): CheckDefinition => ({
  key: "function", name: "SYN function check", check_type: "Qualitative", required: true, scope_key: null, numeric: null, condition: null, evidence_min: 0, instrument_required: false, witness: "None", criterion_source_id: null,
  qualitative: { choices: ["Operates as specified", "Does not operate as specified"], accepted: ["Operates as specified"] }, ...rest,
});
const reading = (value: string | null, unit: string | null = "kPa", over: Partial<Reading> = {}): Reading => ({ check_key: "pressure", state: "Recorded", value, unit, choice: null, reason: null, note: null, evidence_ids: [], ...over });
const chosen = (choice: string | null, over: Partial<Reading> = {}): Reading => ({ check_key: "function", state: "Recorded", value: null, unit: null, choice, reason: null, note: null, evidence_ids: [], ...over });
const verdict = (d: CheckDefinition, r: Reading | undefined) => evaluate(d, r).evaluation;

test("EN08-13 a numeric limit is compared exactly: inclusive and exclusive differ only at the limit itself", () => {
  const inclusive = numeric(), exclusive = numeric({ lower_inclusive: false, upper_inclusive: false });
  // [value, inclusive, exclusive]: exactly at, just inside and just outside each limit.
  for (const [value, closed, open] of [["180.0", "Pass", "Fail"], ["180.1", "Pass", "Pass"], ["179.9", "Fail", "Fail"], ["260.0", "Pass", "Fail"], ["259.9", "Pass", "Pass"], ["260.1", "Fail", "Fail"]] as const) {
    assert.equal(verdict(inclusive, reading(value)), closed, `${value} inclusive`);
    assert.equal(verdict(exclusive, reading(value)), open, `${value} exclusive`);
  }
  assert.match(evaluate(exclusive, reading("180.0")).reason!, /Below the exclusive lower limit of 180\.0 kPa/);
  assert.match(evaluate(inclusive, reading("260.1")).reason!, /Above the inclusive upper limit of 260\.0 kPa/);
  // One-sided criteria are criteria. The open side never fails anything.
  assert.equal(verdict(numeric({ lower: null }), reading("-5")), "Pass");
  assert.equal(verdict(numeric({ upper: null }), reading("99999")), "Pass");
  assert.equal(criterionText(inclusive), "≥ 180.0 and ≤ 260.0 kPa");
  assert.equal(criterionText(exclusive), "> 180.0 and < 260.0 kPa");
});

test("EN08-13 decimals are exact: a binary-float sum or a display rounding never flips an evaluation", () => {
  // 0.1 + 0.2 and 0.1 × 3 are both 0.30000000000000004 in binary floating point, which would sit above an inclusive 0.3.
  const sum = numeric({ unit: "mS", precision: 1, lower: null, upper: "0.3", conversions: [{ from_unit: "offset", multiply: "1", add: "0.2" }, { from_unit: "third", multiply: "3", add: "0" }] });
  assert.deepEqual(evaluate(sum, reading("0.1", "offset")), { evaluation: "Pass", reason: null, compared: "0.3 mS" });
  assert.deepEqual(evaluate(sum, reading("0.1", "third")), { evaluation: "Pass", reason: null, compared: "0.3 mS" });
  assert.equal(verdict(numeric({ unit: "mS", lower: null, upper: "0.3", upper_inclusive: false, conversions: [{ from_unit: "offset", multiply: "1", add: "0.2" }] }), reading("0.1", "offset")), "Fail");
  // A value that one-decimal display would round onto the limit is still judged as the value it is.
  const fine = numeric({ precision: 3 });
  assert.equal(verdict(fine, reading("260.04")), "Fail"); // shows as 260.0
  assert.equal(verdict(fine, reading("179.96")), "Fail"); // shows as 180.0
  assert.equal(verdict(numeric({ precision: 4, lower_inclusive: false }), reading("180.0001")), "Pass"); // shows as 180.0, and is above an exclusive 180.0
  assert.equal(verdict(numeric({ precision: 12, upper_inclusive: false }), reading("259.999999999999")), "Pass");
  // Text is parsed as text. Trailing zeros, a sign and twelve places are exact; an exponent or a thirteenth place is not a number here.
  assert.equal(parseDecimal("215.0"), parseDecimal("215"));
  assert.equal(parseDecimal("-0.000000000001"), -1n);
  for (const bad of ["1e3", "1,5", "0.0000000000001", "", " ", "NaN", ".5", "5."]) assert.equal(parseDecimal(bad), null, bad);
  assert.equal(verdict(numeric(), reading("1e3")), "UnableToAssess");
});

test("EN08-13 only an approved, exact conversion is applied; anything else is unable to assess and never a pass", () => {
  assert.deepEqual(evaluate(numeric(), reading("2.15", "bar")), { evaluation: "Pass", reason: null, compared: "215 kPa" });
  assert.equal(verdict(numeric(), reading("1.8", "bar")), "Pass"); // exactly the inclusive 180.0 kPa
  assert.equal(verdict(numeric({ lower_inclusive: false }), reading("1.8", "bar")), "Fail");
  assert.equal(verdict(numeric(), reading("1.79", "bar")), "Fail");
  // A value that would pass if its unit were ignored, or if a well-known factor were assumed, is not passed.
  const psi = evaluate(numeric(), reading("215.0", "psi"));
  assert.equal(psi.evaluation, "UnableToAssess");
  assert.match(psi.reason!, /in psi; the criterion is in kPa and no approved conversion exists/);
  assert.equal(verdict(numeric({ conversions: [] }), reading("2.15", "bar")), "UnableToAssess");
  assert.equal(verdict(numeric(), reading("215.0", null)), "UnableToAssess");
  // A conversion whose result has no exact twelve-place decimal is reported, never rounded into range.
  const inexact = numeric({ conversions: [{ from_unit: "psi", multiply: "6.894757293168", add: "0" }, { from_unit: "third", multiply: "0.333333333333", add: "0" }] });
  assert.equal(verdict(inexact, reading("31.5", "psi")), "Pass"); // 217.184854734792 kPa exactly
  const rounded = evaluate(inexact, reading("31.55", "psi"));
  assert.deepEqual([rounded.evaluation, rounded.compared], ["UnableToAssess", null]);
  assert.match(rounded.reason!, /does not give an exact kPa value/);
  assert.equal(verdict(inexact, reading("645.5", "third")), "UnableToAssess"); // about 215.17 kPa, comfortably in range, and still not assessed
  assert.equal(verdict(numeric({ conversions: [{ from_unit: "bar", multiply: "one hundred", add: "0" }] }), reading("2.15", "bar")), "UnableToAssess");
});

test("EN08-13 a reading is captured at the precision the basis accepts, and a qualitative outcome is one of the approved choices", () => {
  assert.deepEqual(readingProblems(numeric(), reading("215.0")), []);
  assert.deepEqual(readingProblems(numeric(), reading("215")), []);
  assert.match(readingProblems(numeric(), reading("215.25")).join(" "), /accepts 1 decimal place\. Record what the instrument showed/);
  assert.match(readingProblems(numeric({ precision: 0 }), reading("215.2")).join(" "), /accepts 0 decimal places/);
  assert.match(readingProblems(numeric(), reading("two hundred")).join(" "), /plain decimal number/);
  assert.match(readingProblems(numeric(), reading("215.0", " ")).join(" "), /needs its unit/);
  assert.equal(verdict(qualitative(), chosen("Operates as specified")), "Pass");
  const refused = evaluate(qualitative(), chosen("Does not operate as specified"));
  assert.deepEqual([refused.evaluation, refused.compared], ["Fail", "Does not operate as specified"]);
  // A choice the basis never offered is neither accepted nor failed.
  assert.equal(verdict(qualitative(), chosen("Looks fine")), "UnableToAssess");
  assert.equal(verdict(qualitative(), chosen(null)), "UnableToAssess");
  assert.match(readingProblems(qualitative(), chosen("Looks fine")).join(" "), /choose one of the approved outcomes/);
  assert.deepEqual(readingProblems(qualitative(), chosen("Does not operate as specified")), []);
});

test("EN08-11 a missing criterion stays missing: the reading is kept as captured and nothing is assessed or borrowed", () => {
  const none = numeric({}, { numeric: null }), unbounded = numeric({ lower: null, upper: null }), unaccepted = qualitative({ qualitative: { choices: ["Yes", "No"], accepted: [] } });
  for (const d of [none, unbounded, unaccepted]) assert.equal(hasCriterion(d), false, d.key);
  assert.equal(hasCriterion(numeric()), true);
  assert.equal(hasCriterion(numeric({ upper: null })), true);
  assert.equal(criterionText(none), "Criteria missing");
  const captured = reading("412.0", "umol"), before = structuredClone(captured), result = evaluate(none, captured);
  assert.deepEqual([result.evaluation, result.compared], ["UnableToAssess", null]);
  assert.match(result.reason!, /Criteria missing.*reading is retained as captured/);
  assert.deepEqual(captured, before);
  // Capturing it is not refused: evaluation is separate from capture.
  assert.deepEqual(readingProblems(none, captured), []);
  assert.equal(verdict(unaccepted, chosen("Yes", { check_key: "function" })), "UnableToAssess");
  // It is still required work, it is counted as missing, and it can never complete a scope.
  const c = coverage([none], [{ check_key: "pressure", evaluation: "UnableToAssess", review: "Accepted", applicability: "Current" }]);
  assert.deepEqual([c.required, c.criteria_missing, c.unassessable, c.accepted, coverageComplete(c)], [1, 1, 1, 0, false]);
});

test("EN08-12 only a False condition removes a requirement; Unknown stays required and a typed-in “not applicable” is refused", () => {
  const when = (outcome: "True" | "False" | "Unknown") => numeric({}, { condition: { statement: "SYN a booster pump is fitted", outcome } });
  const notApplicable = reading(null, null, { state: "NotApplicable", reason: "SYN no booster pump" });
  assert.deepEqual([isRequired(when("True")), isRequired(when("Unknown")), isRequired(when("False")), isRequired(numeric({}, { required: false }))], [true, true, false, false]);
  // False: not applicable whatever was entered, with the recorded reason, and out of the required count.
  for (const r of [undefined, reading("120.5"), notApplicable]) assert.equal(verdict(when("False"), r), "NotApplicable");
  assert.match(evaluate(when("False"), undefined).reason!, /Condition not met: SYN a booster pump is fitted/);
  assert.deepEqual(readingProblems(when("False"), notApplicable), []);
  assert.equal(coverage([when("False")], []).required, 0);
  assert.deepEqual(submissionBlockers([when("False")], null, draft({ readings: [] })), []);
  // Unknown and True are evaluated like any other required check.
  for (const outcome of ["Unknown", "True"] as const) assert.deepEqual([verdict(when(outcome), reading("215.0")), verdict(when(outcome), reading("120.5")), verdict(when(outcome), undefined)], ["Pass", "Fail", "NotTested"], outcome);
  assert.equal(coverage([when("Unknown")], []).not_tested, 1);
  // "Not applicable" is never a way to take a check out of the count: refused at capture, and unassessable if it ever arrives.
  for (const d of [numeric(), when("Unknown"), when("True")]) {
    assert.match(readingProblems(d, notApplicable).join(" "), /needs an approved condition in the test basis/);
    assert.equal(verdict(d, notApplicable), "UnableToAssess");
    assert.match(submissionBlockers([d], null, draft({ readings: [notApplicable] })).join(" "), /needs an approved condition/);
  }
  const c = coverage([numeric()], [{ check_key: "pressure", evaluation: "NotApplicable", review: "Accepted", applicability: "Current" }]);
  assert.deepEqual([c.required, c.accepted, c.unassessable], [1, 0, 1]);
});

test("EN08-19 coverage counts accepted evidence only: a pass in review, a returned pass and an unassessed check are all still open", () => {
  const keys = ["a", "b", "c", "d", "e", "f", "g", "h"], definitions = keys.map((key) => numeric({}, { key, scope_key: key < "e" ? "block-a" : "block-b" }));
  const result = (check_key: string, evaluation: EffectiveResult["evaluation"], review: EffectiveResult["review"], applicability: EffectiveResult["applicability"] = "Current"): EffectiveResult => ({ check_key, evaluation, review, applicability });
  const results = [result("a", "Pass", "Accepted"), result("b", "Pass", "InReview"), result("c", "Pass", "Returned"), result("d", "Fail", "Accepted"), result("e", "NotTested", "Accepted"), result("f", "UnableToAssess", "Accepted"), result("g", "Pass", "Accepted", "ReassessmentRequired")];
  assert.deepEqual(coverage(definitions, results), { required: 8, accepted: 1, passed_unreviewed: 2, failed: 1, not_tested: 2, unassessable: 1, reassessment: 1, criteria_missing: 0 });
  for (const review of ["NotSubmitted", "ClarificationRequired", "OnHold"] as const) assert.equal(coverage([definitions[0]], [result("a", "Pass", review)]).accepted, 0, review);
  for (const applicability of ["Unavailable", "HistoricalOnly"] as const) assert.deepEqual([coverage([definitions[0]], [result("a", "Pass", "Accepted", applicability)]).accepted, coverage([definitions[0]], [result("a", "Pass", "Accepted", applicability)]).reassessment], [0, 1], applicability);
  // A scope filter judges exactly that scope. A whole-scope check (no scope key) belongs to every partial scope.
  assert.deepEqual(coverage(definitions, results, new Set(["block-a"])), { required: 4, accepted: 1, passed_unreviewed: 2, failed: 1, not_tested: 0, unassessable: 0, reassessment: 0, criteria_missing: 0 });
  assert.equal(coverage([...definitions, numeric({}, { key: "shared", scope_key: null })], results, new Set(["block-b"])).required, 5);
  // An optional check is never required work, and a result for a check outside the basis counts for nothing.
  assert.equal(coverage([numeric({}, { required: false })], [result("pressure", "Fail", "Accepted")]).required, 0);
  assert.equal(coverage([definitions[0]], [result("zz", "Pass", "Accepted")]).not_tested, 1);
  const all = coverage(definitions.slice(0, 2), [result("a", "Pass", "Accepted"), result("b", "Pass", "Accepted")]);
  assert.deepEqual([all.accepted, coverageComplete(all)], [2, true]);
  assert.equal(coverageComplete(coverage(definitions.slice(0, 2), [result("a", "Pass", "Accepted"), result("b", "Pass", "InReview")])), false);
  // Nothing required is not "complete": an empty scope releases nothing.
  assert.equal(coverageComplete(coverage([], [])), false);
});

test("EN08-25 an instrument is judged at the time of the test: later expiry does not spoil it, later renewal does not repair it", () => {
  const gauge: Calibration = { reference: "SYN-CAL-2025-0914", version: "1", valid_from: "2025-09-14", valid_to: "2026-09-13", withdrawn_effective_from: null, withdrawn_reason: null };
  // Valid on the test date and expired today: the test stands, and the expiry is shown as today's fact.
  assert.deepEqual(assessInstrument(gauge, "2026-09-08"), { assessment: "ValidAtUse", reason: null });
  assert.deepEqual([instrumentExpiredToday(gauge, "2026-09-20"), instrumentExpiredToday(gauge, "2026-09-13"), instrumentExpiredToday(null, "2026-09-20")], [true, false, false]);
  assert.deepEqual([assessInstrument(gauge, "2025-09-14").assessment, assessInstrument(gauge, "2026-09-13").assessment], ["ValidAtUse", "ValidAtUse"]);
  // Used the day after expiry. The renewed certificate starts later and is a different record: it never reaches back.
  const renewed: Calibration = { ...gauge, reference: "SYN-CAL-2026-0920", valid_from: "2026-09-20", valid_to: "2027-09-19" };
  const late = assessInstrument(gauge, "2026-09-14");
  assert.equal(late.assessment, "InvalidAtUse");
  assert.match(late.reason!, /covers 2025-09-14 to 2026-09-13; the test was on 2026-09-14/);
  assert.equal(assessInstrument(renewed, "2026-09-14").assessment, "InvalidAtUse");
  assert.equal(instrumentExpiredToday(renewed, "2026-09-20"), false);
  // A retrospective withdrawal reaches a test on or after its effective date, and no earlier one.
  const withdrawn = (from: string): Calibration => ({ ...gauge, valid_to: "2027-01-09", withdrawn_effective_from: from, withdrawn_reason: "SYN reference standard found out of tolerance" });
  const reached = assessInstrument(withdrawn("2026-08-01"), "2026-09-08");
  assert.equal(reached.assessment, "WithdrawnForUse");
  assert.match(reached.reason!, /withdrawn with effect from 2026-08-01: SYN reference standard/);
  assert.equal(assessInstrument(withdrawn("2026-09-08"), "2026-09-08").assessment, "WithdrawnForUse");
  assert.equal(assessInstrument(withdrawn("2026-09-09"), "2026-09-08").assessment, "ValidAtUse");
  // No calibration record is unknown. It is never assumed valid.
  assert.equal(assessInstrument(null, "2026-09-08").assessment, "Unknown");
  assert.match(assessInstrument(null, "2026-09-08").reason!, /No calibration record/);
});

function draft(over: Partial<AttemptDraft> = {}): AttemptDraft {
  return { readings: [reading("215.0")], evidence: [], prerequisites: [], instruments: [], occurred_at: "2026-09-17T01:30:00.000Z", configuration_reference: "CFG-003 Rev C", ...over };
}
test("EN08-15 EN08-18 submission says precisely what stops it: prerequisites, entries, evidence and instruments, with no general override", () => {
  const d = numeric({}, { evidence_min: 2, instrument_required: true }), blockers = (a: Partial<AttemptDraft>, definitions = [d]) => submissionBlockers(definitions, null, draft(a)).join(" | ");
  const evidence = (id: string, state: AttemptDraft["evidence"][number]["state"], check_key: string | null = "pressure") => ({ id, check_key, state, label: `SYN photo ${id}` });
  const complete = { evidence: [evidence("1", "Complete"), evidence("2", "Complete")], instruments: [{ reference: "SYN-INS-FM-022", assessment: "ValidAtUse" as const, reason: null }] };
  assert.equal(blockers(complete), "");
  assert.match(blockers({ ...complete, occurred_at: null }), /when the test actually took place/);
  assert.match(blockers({ ...complete, configuration_reference: " " }), /exact configuration that was tested/);
  // A mandatory prerequisite, a hold point and a witness point each stop it in their own words; an optional one does not.
  const prerequisite = (kind: AttemptDraft["prerequisites"][number]["kind"], mandatory = true, met = false) => ({ key: kind.toLowerCase(), label: `SYN ${kind}`, kind, mandatory, met, source: null });
  assert.match(blockers({ ...complete, prerequisites: [prerequisite("Isolation")] }), /SYN Isolation: this prerequisite is mandatory and is not met\. There is no general override/);
  assert.match(blockers({ ...complete, prerequisites: [prerequisite("Hold")] }), /this hold point is mandatory/);
  assert.match(blockers({ ...complete, prerequisites: [prerequisite("Witness")] }), /this witness point is mandatory/);
  assert.equal(blockers({ ...complete, prerequisites: [prerequisite("Access", false), prerequisite("Hold", true, true)] }), "");
  // Every required check has an entry: a reading, or "not tested" with its reason.
  assert.match(blockers({ ...complete, readings: [] }), /SYN holding pressure: no entry/);
  assert.match(blockers({ ...complete, readings: [reading(null, null, { state: "NotTested" })] }), /say why this check was not tested/);
  assert.equal(blockers({ readings: [reading(null, null, { state: "NotTested", reason: "SYN zone isolated for repair" })] }), ""); // nothing was measured, so no evidence or instrument is owed
  // Evidence: the minimum counts complete items of this check only, and nothing incomplete travels with a submission.
  assert.match(blockers({ ...complete, evidence: [evidence("1", "Complete"), evidence("2", "Complete", "function")] }), /2 items of evidence required, 1 complete/);
  assert.match(blockers({ ...complete, evidence: [evidence("1", "Complete"), evidence("2", "Complete", null)] }), /2 items of evidence required, 1 complete/);
  for (const [state, words] of [["Pending", /evidence is pending\. Wait for the upload to finish/], ["Missing", /evidence is missing\. Replace or remove it/], ["Unsupported", /evidence is unsupported\. Replace or remove it/], ["Restricted", /cannot be read with your access/]] as const)
    assert.match(blockers({ ...complete, evidence: [...complete.evidence, evidence("3", state, null)] }), words, state);
  // Instruments: one is named where the check needs one, and one that was invalid or withdrawn at the test stops the submission.
  assert.match(blockers({ ...complete, instruments: [] }), /name the instrument that was used/);
  for (const assessment of ["InvalidAtUse", "WithdrawnForUse"] as const) assert.match(blockers({ ...complete, instruments: [{ reference: "SYN-INS-PG-009", assessment, reason: "SYN calibration reason." }] }), /SYN-INS-PG-009: SYN calibration reason\. A result cannot be submitted on this instrument/, assessment);
  assert.equal(blockers({ ...complete, instruments: [{ reference: "SYN-INS-X", assessment: "Unknown", reason: null }] }), "");
  // An attempt answers for the scope it was opened on, and a failing reading is not a blocker: it is submitted as a failure.
  const other = numeric({}, { key: "other", name: "SYN other block", scope_key: "block-b" });
  assert.match(submissionBlockers([numeric({}, { scope_key: "block-a" }), other], null, draft()).join(" "), /SYN other block: no entry/);
  assert.deepEqual(submissionBlockers([numeric({}, { scope_key: "block-a" }), other], new Set(["block-a"]), draft()), []);
  assert.deepEqual(submissionBlockers([numeric()], null, draft({ readings: [reading("120.5")] })), []);
});

test("EN08-21 EN08-24 one defect per check occurrence of one host, closed only by an accepted fresh pass of that same check", () => {
  const host = { host_type: "ProjectCommissioningScope" as const, host_id: "c1" };
  assert.equal(defectKey(host, "pressure"), "ProjectCommissioningScope:c1:pressure");
  assert.equal(defectKey(host, "pressure"), defectKey({ ...host }, "pressure"));
  assert.notEqual(defectKey(host, "pressure"), defectKey(host, "flow"));
  assert.notEqual(defectKey(host, "pressure"), defectKey({ ...host, host_id: "c2" }, "pressure"));
  assert.notEqual(defectKey(host, "pressure"), defectKey({ host_type: "ServiceAppointment", host_id: "c1" }, "pressure"));
  const retest = (evaluation: "Pass" | "Fail", review: "Accepted" | "InReview" | "Returned", check_key = "pressure") => ({ review, results: [{ check_key, evaluation }], predecessor_has_defect: true });
  assert.equal(defectClosable({ check_key: "pressure" }, retest("Pass", "Accepted")), null);
  assert.match(defectClosable({ check_key: "pressure" }, retest("Pass", "InReview"))!, /only once its evidence is accepted/);
  assert.match(defectClosable({ check_key: "pressure" }, retest("Pass", "Returned"))!, /only once its evidence is accepted/);
  assert.match(defectClosable({ check_key: "pressure" }, retest("Fail", "Accepted"))!, /did not pass/);
  assert.match(defectClosable({ check_key: "pressure" }, retest("Pass", "Accepted", "flow"))!, /did not retest the failed check/);
});
