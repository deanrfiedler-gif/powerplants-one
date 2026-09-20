import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { AppError } from "../../src/platform/errors";
import { applicabilities, evaluations, reviewStates, type Coverage } from "../../src/inspections/model";
import {
  applicabilityPresentation, asBuiltPresentation, basisPresentation, basisStates, commissioningHref, commissioningPath, csv, csvCell, duePresentation, evaluationPresentation, evidencePresentation, gateBlockers, nextRequirement, obligationPresentation, obligationSatisfied,
  obligationStates, outstandingFor, policyAllows, receivingPresentation, receivingState, receivingStates, reconciliationPresentation, reconciliationStates, redlineOpen, redlinePresentation, redlineStates, releaseGates, releasePresentation, releaseStates,
  reviewPresentation, sourceConditions, sourcePresentation, workflow, workflowPresentation, workflows, type GateFacts, type ObligationFact, type PackageFacts, type Policy, type Presentation,
} from "../../src/engineering/commissioning/model";
import { parseBasisCommand, parseConfigurationCommand, parseHandoverCommand, parseInspectionCommand, parsePackageCommand, parseReleaseCommand } from "../../src/engineering/commissioning/validation";

// EN-08's pure rules. Task-local labels EN08-nn (build plan r02); none is a parent acceptance pass.
const counts = (required: number, over: Partial<Coverage> = {}): Coverage => ({ required, accepted: 0, passed_unreviewed: 0, failed: 0, not_tested: 0, unassessable: 0, reassessment: 0, criteria_missing: 0, ...over });
const obligation = (kind: ObligationFact["kind"], stage: ObligationFact["stage"], state: ObligationFact["state"], title = `SYN ${kind}`): ObligationFact => ({ id: title, kind, title, stage, state, owner_name: "SYN Sam Jordan" });
// A package whose basis is approved, whose twelve checks are accepted and whose configuration is reconciled: nothing outstanding.
const facts = (over: Partial<PackageFacts> = {}): PackageFacts => ({
  archived: false, basis: "ApprovedForTest", basis_in_review: false, coverage: counts(12, { accepted: 12 }), attempts: 2, attempts_in_review: 0, attempts_returned: 0, defects_open: 0, reconciliation: "Reconciled", differences_open: 0, referred_open: 0,
  redlines_review: 0, redlines_to_incorporate: 0, associations_review: 0, identity_unverified_critical: 0, backups_unverified: 0, holds_open: 0, source: "Current", release: "None", release_partial: false, release_applicability: "Current",
  candidate_ready: false, obligations: [], receiving: [], ...over,
});
const row = (f: PackageFacts) => { const n = nextRequirement(f); return [evidencePresentation(f.coverage, f.attempts).label, asBuiltPresentation(f).label, n.label, n.action, n.kind, workflow(f)]; };

test("EN08-59 the eight review rows of mockup r02 are derived from retained facts, never stored as a status", () => {
  // 001: every check accepted, and one redline accepted for incorporation. Accepted test evidence is not an as-built.
  const one = facts({ reconciliation: "UnderReview", redlines_to_incorporate: 1, obligations: [obligation("Manual", "TechnicalIssue", "Complete"), obligation("Training", "ServiceAcceptance", "EvidenceRecorded")] });
  assert.deepEqual(row(one), ["12 / 12 accepted", "In review", "1 redline open", "Resolve redlines", "condition", "Testing"]);
  assert.deepEqual([nextRequirement(one).view, nextRequirement(one).panel, nextRequirement(one).tone], ["configuration", "redlines", "caution"]);
  // 002: one required check has no criterion. Its reading is kept and the package cannot be assessed.
  const two = facts({ coverage: counts(3, { passed_unreviewed: 2, unassessable: 1, criteria_missing: 1 }), attempts: 1, attempts_in_review: 1, reconciliation: "Unassessed" });
  assert.deepEqual(row(two), ["Unable to assess", "Draft", "Criteria missing", "Complete test basis", "condition", "InReview"]);
  // 003: a failed check with its one open defect, after two returned attempts.
  const three = facts({ coverage: counts(4, { passed_unreviewed: 3, failed: 1 }), attempts_returned: 1, defects_open: 1, reconciliation: "Unassessed" });
  assert.deepEqual(row(three), ["1 failed check", "Draft", "Retest required", "Open retest", "condition", "FollowUpRequired"]);
  assert.deepEqual([evidencePresentation(three.coverage, 2).tone, evidencePresentation(counts(4, { failed: 2 }), 2).label], ["failure", "2 failed checks"]);
  // 004: the bound configuration moved on upstream and a changed association asks for review of the checks that rested on it.
  const four = facts({ coverage: counts(3, { accepted: 1, reassessment: 2 }), attempts: 1, source: "ReassessmentRequired", associations_review: 1, reconciliation: "Unassessed" });
  assert.deepEqual(row(four), ["Reassessment", "Source changed", "Review mapping", "Review mapping", "step", "FollowUpRequired"]);
  assert.deepEqual(nextRequirement({ ...four, associations_review: 0 }).label, "Source changed");
  // 005: a partial candidate whose own scope is complete. Ready for review is information, never a release.
  const five = facts({ coverage: counts(8, { accepted: 8 }), release: "Draft", release_partial: true, candidate_ready: true });
  assert.deepEqual(row(five), ["8 / 8 accepted", "Ready for review", "Review partial scope", "Review as-built package", "step", "Testing"]);
  assert.deepEqual([asBuiltPresentation(five).tone, asBuiltPresentation(five).icon], ["information", "clock"]);
  assert.equal(nextRequirement({ ...five, release_partial: false }).label, "Prepare as-built release");
  // 006: issued, with operator training still only planned for Service acceptance.
  const six = facts({ coverage: counts(9, { accepted: 9 }), attempts: 1, release: "Issued", obligations: [obligation("Manual", "TechnicalIssue", "Complete"), obligation("Training", "ServiceAcceptance", "Planned")] });
  assert.deepEqual(row(six), ["9 / 9 accepted", "Released", "Training required", "Open Service handover", "condition", "TechnicallyReleased"]);
  // 007: issued, and the Service receiver returned the pack. Released stays released; the return is its own condition.
  const seven = facts({ coverage: counts(10, { accepted: 10 }), attempts: 1, release: "Issued", receiving: [{ destination: "Service", state: "Returned" }] });
  assert.deepEqual(row(seven), ["10 / 10 accepted", "Released", "Handover returned", "Open Service handover", "condition", "FollowUpRequired"]);
  // 008: approved basis, nothing tested yet, and a backup reference whose identity is not verified.
  const eight = facts({ coverage: counts(2, { not_tested: 2 }), attempts: 0, reconciliation: "Unassessed", backups_unverified: 1 });
  assert.deepEqual(row(eight), ["Not started", "Draft", "Verify backup", "Verify backup", "step", "Testing"]);
  assert.equal(nextRequirement({ ...eight, backups_unverified: 0 }).label, "Start testing");
  // The same facts give the same row: opening a requirement navigates and decides nothing.
  assert.deepEqual(row(one), row(structuredClone(one)));
});

test("EN08-06 one condition has one label, tone and icon; green is an established positive fact and “not requested” carries no tick", () => {
  assert.deepEqual(receivingPresentation.NotRequested, { label: "Not requested", tone: "neutral", icon: "unsent" });
  assert.deepEqual(receivingPresentation.InReview, { label: "In review", tone: "information", icon: "clock" });
  assert.deepEqual(redlinePresentation.AcceptedForIncorporation, { label: "Pending incorporation", tone: "caution", icon: "alert" });
  assert.deepEqual(obligationPresentation.Dispositioned, { label: "Decision recorded", tone: "neutral", icon: "document" });
  // Approved for issue is not issued: it is information until the issue event exists.
  assert.deepEqual([releasePresentation.ApprovedForIssue.tone, releasePresentation.Issued.tone, releasePresentation.Withdrawn.tone], ["information", "positive", "neutral"]);
  // Every state of every dimension has its entry, and no two states of one dimension share a label.
  const maps: [string, readonly string[], Record<string, Presentation>][] = [["basis", [...basisStates, "None"], basisPresentation], ["review", reviewStates, reviewPresentation], ["evaluation", evaluations, evaluationPresentation], ["applicability", applicabilities, applicabilityPresentation],
    ["reconciliation", reconciliationStates, reconciliationPresentation], ["redline", redlineStates, redlinePresentation], ["release", [...releaseStates, "None"], releasePresentation], ["receiving", receivingStates, receivingPresentation], ["obligation", obligationStates, obligationPresentation],
    ["source", sourceConditions, sourcePresentation], ["workflow", workflows, workflowPresentation]];
  const positive: Record<string, string[]> = { basis: ["ApprovedForTest"], review: ["Accepted"], evaluation: ["Pass"], applicability: ["Current"], reconciliation: ["Reconciled"], redline: ["IncorporatedVerified"], release: ["Issued"], receiving: ["Accepted"],
    obligation: ["EvidenceRecorded", "CompetenceConfirmed", "Complete"], source: ["Current"], workflow: ["TechnicallyReleased"] };
  for (const [name, states, map] of maps) {
    assert.deepEqual(Object.keys(map).sort(), [...states].sort(), name);
    for (const state of states) assert.ok(map[state].label && map[state].tone && map[state].icon, `${name}.${state}`);
    assert.deepEqual(states.filter((s) => map[s].tone === "positive").sort(), [...positive[name]].sort(), `${name}: green`);
    // A tick is only ever drawn on a positive fact.
    for (const state of states) if (map[state].icon === "tick" || map[state].icon === "tick-circle") assert.equal(map[state].tone, "positive", `${name}.${state}`);
    if (name !== "release") assert.equal(new Set(states.map((s) => map[s].label)).size, states.length, `${name}: labels`);
  }
  // A failed check is the only failure tone among results; unknown, unassessed and not tested are neutral, never red and never green.
  assert.deepEqual(evaluations.map((e) => evaluationPresentation[e].tone), ["positive", "failure", "neutral", "neutral", "neutral"]);
  // Dates: missing is "Date needed", the future is neutral, and only an open item past its date is overdue.
  assert.deepEqual(duePresentation(null, "2026-09-20", true), { label: "Date needed", tone: "neutral", icon: "none" });
  assert.deepEqual(duePresentation("2026-09-22", "2026-09-20", true), { label: "Due", tone: "neutral", icon: "none" });
  assert.deepEqual(duePresentation("2026-09-20", "2026-09-20", true).label, "Due");
  assert.deepEqual(duePresentation("2026-09-19", "2026-09-20", true), { label: "Overdue", tone: "failure", icon: "error" });
  assert.deepEqual(duePresentation("2026-09-19", "2026-09-20", false), { label: "Due", tone: "neutral", icon: "none" });
  // The evidence cell is a count, never a percentage, and never green before every required check is accepted.
  assert.deepEqual(evidencePresentation(counts(12, { accepted: 11, passed_unreviewed: 1 }), 1), { label: "11 / 12 accepted", tone: "information", icon: "clock" });
  assert.deepEqual(evidencePresentation(counts(12, { accepted: 11, not_tested: 1 }), 1), { label: "11 / 12 accepted", tone: "neutral", icon: "target" });
  assert.equal(evidencePresentation(counts(0), 1).tone, "neutral");
  for (const c of [counts(12, { accepted: 12 }), counts(12, { accepted: 3, failed: 1 }), counts(3, { unassessable: 1 })]) assert.doesNotMatch(evidencePresentation(c, 1).label, /%/);
});

const gateFacts = (over: Partial<GateFacts> = {}): GateFacts => ({ ...facts(), partial: false, scope_selected: 1, scope_excluded_without_reason: 0, shared_unresolved: [], manifest_complete: true, recipients_named: true, reviewer_refusal: null, criteria_source_current: true, ...over });
const gate = (f: GateFacts, key: string) => releaseGates(f).find((g) => g.key === key)!;
test("EN08-33 EN08-34 EN08-36 every blocker is named in its own gate, and a fully satisfied candidate has none", () => {
  const clear = releaseGates(gateFacts());
  assert.deepEqual(clear.map((g) => g.key), ["basis", "scope", "evidence", "configuration", "obligations", "support", "authority", "manifest"]);
  assert.deepEqual([clear.every((g) => g.satisfied), gateBlockers(clear)], [true, []]);
  const cases: [name: string, facts: Partial<GateFacts>, gate: string, words: RegExp, also?: string[]][] = [
    ["missing test", { coverage: counts(12, { accepted: 11, not_tested: 1 }) }, "evidence", /1 required check is not tested/],
    ["failed check", { coverage: counts(12, { accepted: 11, failed: 1 }) }, "evidence", /1 required check failed/],
    ["unreviewed pass", { coverage: counts(12, { accepted: 10, passed_unreviewed: 2 }) }, "evidence", /2 passing results have no accepted evidence review/],
    ["unassessable", { coverage: counts(12, { accepted: 11, unassessable: 1 }) }, "evidence", /1 required check could not be assessed/],
    ["reassessment", { coverage: counts(12, { accepted: 11, reassessment: 1 }) }, "evidence", /1 accepted result needs reassessment for the present configuration/],
    ["open defect", { defects_open: 1 }, "evidence", /1 defect is open/],
    ["nothing required", { coverage: counts(0) }, "evidence", /No required check is defined/],
    ["criteria missing", { coverage: counts(12, { accepted: 11, unassessable: 1, criteria_missing: 1 }) }, "basis", /1 required check has no acceptance criterion/, ["evidence"]], // and its reading could not be assessed
    ["basis not approved", { basis: "InReview" }, "basis", /not approved for test/],
    ["source changed", { source: "ReassessmentRequired" }, "basis", /Source changed: a release decision rests on sources whose currentness is established/],
    ["source unavailable", { source: "Unavailable" }, "basis", /Currentness not established/],
    ["unverified critical identity", { identity_unverified_critical: 1 }, "scope", /1 critical asset is not verified\. An unknown identity never becomes a verified asset/],
    ["nothing selected", { scope_selected: 0 }, "scope", /No scope is selected/],
    ["unnamed exclusion", { scope_excluded_without_reason: 1 }, "scope", /Every excluded scope item needs its reason/],
    ["unassessed shared interface", { partial: true, shared_unresolved: ["Shared pump and control interface"] }, "scope", /Shared pump and control interface: this shared interface is not assessed as independent/],
    ["unreconciled", { reconciliation: "UnderReview" }, "configuration", /Configuration is under review/],
    ["open difference", { reconciliation: "DifferencesOpen", differences_open: 2 }, "configuration", /2 differences are open/],
    ["referred change", { referred_open: 1 }, "configuration", /1 difference is with change review\. A request is not a resolution/],
    ["redline in review", { redlines_review: 1 }, "configuration", /1 redline is still in review/],
    ["redline pending incorporation", { redlines_to_incorporate: 1 }, "configuration", /accepted for incorporation and not yet incorporated into a verified successor/],
    ["association review", { associations_review: 1 }, "configuration", /1 sensor, valve or area association needs review/],
    ["open hold", { holds_open: 1 }, "obligations", /1 mandatory hold is open/],
    ["manual outstanding", { obligations: [obligation("Manual", "TechnicalIssue", "Open", "SYN O&M manuals")] }, "support", /SYN O&M manuals: required before technical issue and outstanding/],
    ["backup unverified", { backups_unverified: 1 }, "support", /1 configuration backup reference has no verified identity\. A backup that exists is not a backup that was verified/],
    ["ineligible reviewer", { reviewer_refusal: "You prepared or submitted this candidate, so you cannot approve it." }, "authority", /cannot approve it/],
    ["incomplete manifest", { manifest_complete: false }, "manifest", /output manifest is incomplete/],
    ["no recipients", { recipients_named: false }, "manifest", /Name the required recipients/],
  ];
  for (const [name, over, key, words, also = []] of cases) {
    const gates = releaseGates(gateFacts(over)), hit = gates.find((g) => g.key === key)!;
    assert.equal(hit.satisfied, false, name);
    assert.match(hit.reasons.join(" "), words, name);
    // A blocker belongs to its gate. It never leaks into, or is cleared by, another one.
    assert.deepEqual(gates.filter((g) => !g.satisfied).map((g) => g.key), [key, ...also], name);
  }
  // Several blockers are all reported: fixing one never hides the rest.
  assert.equal(gateBlockers(releaseGates(gateFacts({ defects_open: 1, redlines_to_incorporate: 1, holds_open: 1, recipients_named: false }))).length, 4);
});

test("EN08-34 an obligation blocks the stage it declares and no other; planned or delivered training is not evidenced training", () => {
  const training = (stage: ObligationFact["stage"], state: ObligationFact["state"] = "Planned") => gateFacts({ obligations: [obligation("Training", stage, state, "SYN operator training")] });
  for (const stage of ["ServiceAcceptance", "CustomerHandover"] as const) assert.deepEqual(gateBlockers(releaseGates(training(stage))), [], stage);
  for (const stage of ["TechnicalIssue", "TestPrerequisite"] as const) assert.match(gateBlockers(releaseGates(training(stage))).join(" "), /SYN operator training: required before .* and planned/, stage);
  assert.match(gateBlockers(releaseGates(training("TechnicalIssue", "Delivered"))).join(" "), /and delivered/);
  for (const state of ["EvidenceRecorded", "CompetenceConfirmed", "Complete", "Dispositioned"] as const) assert.deepEqual(gateBlockers(releaseGates(training("TechnicalIssue", state))), [], state);
  assert.deepEqual(obligationStates.filter(obligationSatisfied), ["EvidenceRecorded", "CompetenceConfirmed", "Complete", "Dispositioned"]);
  assert.equal(gate(training("TechnicalIssue"), "evidence").satisfied, true);
  // The same split drives the register: training for Service acceptance is a condition of handover, after issue, and never before it.
  const later = [obligation("Training", "ServiceAcceptance", "Open")];
  assert.deepEqual(outstandingFor({ obligations: later }, ["TechnicalIssue"]), []);
  assert.equal(nextRequirement(facts({ obligations: later, candidate_ready: true })).label, "Prepare as-built release");
  assert.equal(nextRequirement(facts({ obligations: [obligation("Training", "TechnicalIssue", "Open")] })).label, "Training required");
  assert.equal(nextRequirement(facts({ obligations: [obligation("Manual", "TechnicalIssue", "Open")] })).label, "Manual outstanding");
  assert.equal(nextRequirement(facts({ release: "Issued", obligations: later })).label, "Training required");
  assert.equal(nextRequirement(facts({ release: "Issued", obligations: [obligation("Manual", "CustomerHandover", "Open")] })).label, "1 obligation open");
  // Accepted for incorporation is not incorporated, and a rejected or verified redline is no longer open work.
  assert.deepEqual(redlineStates.filter(redlineOpen), ["Recorded", "UnderReview", "ClarificationRequired", "AcceptedForIncorporation"]);
});

test("EN08-48 EN08-41 a receiving state is read from its own request: unreachable is unknown, never “not requested” and never accepted", () => {
  assert.equal(receivingState(null), "NotRequested");
  assert.equal(receivingState({ latest_outcome: null, delivery: "Delivered" }), "Requested");
  assert.equal(receivingState({ latest_outcome: null, delivery: "Pending" }), "Requested");
  assert.equal(receivingState({ latest_outcome: null, delivery: "Unknown" }), "OutcomeUnknown");
  assert.equal(receivingState({ latest_outcome: null, delivery: "Unavailable" }), "Unavailable");
  for (const outcome of ["Accepted", "Returned", "ClarificationRequired"] as const) assert.equal(receivingState({ latest_outcome: outcome, delivery: "Delivered" }), outcome);
  assert.equal(receivingState({ latest_outcome: "Returned", delivery: "Unknown" }), "Returned"); // a recorded outcome wins over a later delivery doubt
  // The derived workflow and next step follow: technical release, Service acceptance and an unknown outcome are separate facts.
  const issued = (state: PackageFacts["receiving"][number]["state"] | null, over: Partial<PackageFacts> = {}) => facts({ release: "Issued", receiving: state ? [{ destination: "Service", state }] : [], ...over });
  assert.deepEqual([workflow(issued(null)), nextRequirement(issued(null)).label], ["TechnicallyReleased", "Request Service handover"]);
  assert.deepEqual([workflow(issued("Requested")), nextRequirement(issued("Requested")).label], ["TechnicallyReleased", "Handover pending"]);
  assert.deepEqual([nextRequirement(issued("OutcomeUnknown")).label, nextRequirement(issued("OutcomeUnknown")).kind], ["Outcome unknown", "condition"]);
  assert.equal(nextRequirement(issued("Unavailable")).code, "ReceivingUnknown");
  assert.deepEqual([workflow(issued("Returned")), nextRequirement(issued("ClarificationRequired")).label], ["FollowUpRequired", "Handover returned"]);
  assert.equal(nextRequirement(issued("Accepted")).label, "View history");
  // An Equipment acceptance is not a Service acceptance.
  assert.equal(nextRequirement(facts({ release: "Issued", receiving: [{ destination: "Equipment", state: "Accepted" }] })).label, "Request Service handover");
  // A source that moved after issue leaves the release issued and asks for follow-up.
  assert.deepEqual([workflow(issued("Accepted", { release_applicability: "ReassessmentRequired" })), nextRequirement(issued("Accepted", { release_applicability: "ReassessmentRequired" })).label, asBuiltPresentation(issued("Accepted", { source: "ReassessmentRequired" })).label], ["FollowUpRequired", "Source changed", "Released"]);
});

test("EN08-01 the workflow is a summary of retained facts in a fixed order of precedence", () => {
  assert.equal(workflow(facts({ basis: "None" })), "Draft");
  assert.equal(workflow(facts({ basis: "Draft" })), "Preparing");
  assert.equal(workflow(facts({ basis: "InReview", basis_in_review: true })), "InReview");
  assert.equal(workflow(facts()), "Testing");
  assert.equal(workflow(facts({ attempts_in_review: 1 })), "InReview");
  assert.equal(workflow(facts({ release: "InReview" })), "InReview");
  assert.equal(workflow(facts({ release: "ApprovedForIssue" })), "InReview"); // approved for issue is not issued
  for (const over of [{ defects_open: 1 }, { attempts_returned: 1 }, { source: "ReassessmentRequired" as const }, { basis: "Returned" as const }]) assert.equal(workflow(facts({ ...over, attempts_in_review: 1 })), "FollowUpRequired", JSON.stringify(over));
  assert.equal(workflow(facts({ release: "Issued" })), "TechnicallyReleased");
  assert.equal(workflow(facts({ archived: true, release: "Issued", defects_open: 1 })), "Archived");
  assert.deepEqual([nextRequirement(facts({ basis: "None", coverage: counts(0) })).label, nextRequirement(facts({ basis: "Returned" })).label, nextRequirement(facts({ basis: "InReview" })).label], ["Complete test basis", "Correct test basis", "Approve test basis"]);
  assert.equal(nextRequirement(facts({ source: "Unavailable" })).label, "Currentness not established");
  assert.equal(nextRequirement(facts({ release: "ApprovedForIssue" })).label, "Issue approved release");
  assert.equal(nextRequirement(facts({ attempts_returned: 1, coverage: counts(12, { accepted: 11, passed_unreviewed: 1 }) })).label, "Evidence returned");
  assert.equal(nextRequirement(facts({ referred_open: 1, reconciliation: "DifferencesOpen" })).label, "Differences open");
});

test("EN08-14 EN08-43 EN08-50 a role label grants nothing: an absent policy blocks, and the policy must name the person, the role and the destination", () => {
  const policy: Policy = { id: "p", policy_version: 4, independence: { basis: true, evidence: true, as_built: true }, grants: [{ actor_id: "casey", role: "BasisApprover", destinations: [] }, { actor_id: "drew", role: "Issuer", destinations: [] }, { actor_id: "jamie", role: "Receiver", destinations: ["Service"] }] };
  assert.match(policyAllows(null, "casey", "BasisApprover")!, /^Authority not configured: no commissioning policy covers this company and site/);
  assert.match(policyAllows(null, "jamie", "Receiver", { destination: "Service" })!, /^Authority not configured/);
  assert.equal(policyAllows(policy, "casey", "BasisApprover"), null);
  assert.match(policyAllows(policy, "casey", "Issuer")!, /policy \(version 4\) does not name you as issuer/);
  assert.match(policyAllows(policy, "casey", "EvidenceReviewer")!, /does not name you as evidence reviewer/);
  assert.match(policyAllows(policy, "sam", "BasisApprover")!, /does not name you as test basis approver/);
  assert.equal(policyAllows(policy, "jamie", "Receiver", { destination: "Service" }), null);
  assert.match(policyAllows(policy, "jamie", "Receiver", { destination: "Equipment" })!, /does not name you as receiver for Equipment \(installed base\)/);
  assert.match(policyAllows(policy, "drew", "Receiver", { destination: "Service" })!, /does not name you as receiver for Service/);
});

test("EN08-53 CSV cells are quoted and formula-leading text is neutralised; only known commissioning routes resolve a destination", () => {
  for (const lead of ["=", "+", "-", "@", "\t", "\r"]) assert.equal(csvCell(`${lead}SUM(A1)`), `"'${lead}SUM(A1)"`, JSON.stringify(lead));
  assert.equal(csvCell("=HYPERLINK(\"http://example.invalid\")"), `"'=HYPERLINK(""http://example.invalid"")"`);
  assert.equal(csvCell('say "hi"'), `"say ""hi"""`);
  assert.deepEqual([csvCell(null), csvCell(undefined), csvCell(0), csvCell("SYN-EN08-001"), csvCell("a=b")], [`""`, `""`, `"0"`, `"SYN-EN08-001"`, `"a=b"`]);
  assert.equal(csv([["Reference", "Due"], ["SYN-EN08-008", "Date needed"]]), `"Reference","Due"\r\n"SYN-EN08-008","Date needed"\r\n`);
  assert.deepEqual([commissioningPath("/engineering/commissioning")?.view?.id, commissioningPath("/engineering/commissioning/releases")?.view?.id, commissioningPath("/engineering/commissioning/packages/abc")?.record_id], ["register", "releases", "abc"]);
  for (const path of ["/engineering/commissioning/unknown", "/engineering/abc/commissioning", "/engineering/abc/materials", "/engineering/commissioning/releases/approve"]) assert.equal(commissioningPath(path), undefined, path);
  // Every next requirement opens one of those destinations. It is a link: it carries no decision.
  for (const f of [facts(), facts({ release: "Issued" }), facts({ basis: "None" }), facts({ defects_open: 1 }), facts({ archived: true })]) assert.ok(commissioningPath(commissioningHref(nextRequirement(f).view).split("?")[0])?.view, nextRequirement(f).code);
});

// ---------------------------------------------------------------------------------------------
const head = (reason = "SYN unit") => ({ operation_id: randomUUID(), schema_version: 1, reason }), id = () => randomUUID();
function refused(parse: () => unknown, field: string | RegExp, words?: RegExp) {
  assert.throws(parse, (e: unknown) => {
    assert.ok(e instanceof AppError, String(e));
    assert.deepEqual([e.status, e.code], [422, "InvalidData"]);
    const hit = e.field_errors.find((x) => (typeof field === "string" ? x.field === field : field.test(x.field)));
    assert.ok(hit, `${String(field)} not in ${JSON.stringify(e.field_errors)}`);
    if (words) assert.match(hit.message, words);
    return true;
  });
}
const item = (over: Record<string, unknown> = {}) => ({ key: "pump-p01", kind: "Asset", asset_id: null, reference: "P-01", title: "SYN pump", installed_location: "Shed", served_areas: ["Greenhouse 01"], disposition: "Included", exclusion_reason: null, critical: true, ...over });
const scope = (over: Record<string, unknown> = {}) => ({ ...head(), action: "scope", record_id: id(), scope_id: id(), expected_version: 1, statement: "SYN scope", items: [item()], interfaces: [], ...over });
const check = (over: Record<string, unknown> = {}) => ({ key: "pressure", name: "SYN pressure", check_type: "Numeric", required: true, scope_key: null, numeric: { unit: "kPa", precision: 1, lower: "180.0", lower_inclusive: true, upper: "260.0", upper_inclusive: true, conversions: [] }, qualitative: null, condition: null, evidence_min: 0, instrument_required: false, witness: "None", criterion_source_id: null, ...over });
const basis = (checks: unknown[], over: Record<string, unknown> = {}) => ({ ...head(), action: "save", record_id: id(), basis_id: id(), expected_version: 1, reference: "CP-004", revision: "r03", checks, prerequisites: [], ...over });

test("EN08-45 every parser lists what it accepts: an approval flag, a status, a hash, an evaluation, an identity or a partial flag is refused before any rule runs", () => {
  const create = { ...head(), action: "create", id: id(), scope_id: id(), title: "SYN package", system_name: "Irrigation", area: "Greenhouse 01" };
  assert.equal(parsePackageCommand(create).action, "create");
  for (const smuggled of [{ approved: true }, { workflow: "TechnicallyReleased" }, { reference: "SYN-EN08-999" }, { created_by: id() }, { company_id: id() }]) refused(() => parsePackageCommand({ ...create, ...smuggled }), Object.keys(smuggled)[0], /not accepted/);
  // Identity is read from the canonical asset record. A client that sends one is refused, and what is parsed is never "Verified".
  refused(() => parsePackageCommand(scope({ items: [item({ identity: "Verified" })] })), "identity");
  const parsed = parsePackageCommand(scope());
  assert.equal(parsed.action === "scope" && parsed.items[0].identity, "Unknown");
  refused(() => parsePackageCommand(scope({ items: [item({ verified: true })] })), "verified");
  // An evaluation is computed by the server from the raw entry and the frozen criterion.
  const save = { ...head(), action: "save", record_id: id(), attempt_id: id(), expected_version: 2, configuration_reference: "CFG-003 Rev C", occurred_at: "2026-09-17T01:30:00.000Z", timezone: "Australia/Brisbane", prerequisites: [], readings: [{ check_key: "pressure", state: "Recorded", value: "215.0", unit: "kPa" }], instrument_ids: [] };
  assert.equal(parseInspectionCommand(save).action, "save");
  for (const smuggled of [{ evaluation: "Pass" }, { compared: "215 kPa" }, { review: "Accepted" }]) refused(() => parseInspectionCommand({ ...save, readings: [{ ...save.readings[0], ...smuggled }] }), Object.keys(smuggled)[0]);
  for (const smuggled of [{ evaluation: "Pass" }, { state: "Submitted" }, { submitted_hash: "a".repeat(64) }, { performer_id: id() }, { independence_required: false }]) refused(() => parseInspectionCommand({ ...save, ...smuggled }), Object.keys(smuggled)[0]);
  refused(() => parseInspectionCommand({ ...save, readings: [{ check_key: "pressure", state: "Recorded", value: 215.0, unit: "kPa" }] }), "readings-0", /plain decimal number as text/); // a number is never taken through a float
  refused(() => parseInspectionCommand({ ...save, readings: [save.readings[0], save.readings[0]] }), "readings", /appears once/);
  refused(() => parseInspectionCommand({ ...save, timezone: "Brisbane/Nowhere" }), "timezone");
  // Whether a release is partial is derived from what it holds back.
  const release = { ...head(), action: "save", record_id: id(), release_id: id(), expected_version: 1, included: ["block-a"], excluded: [{ key: "block-b", reason: "SYN open defect" }], audience: "Internal", recipients: [] };
  assert.equal(parseReleaseCommand(release).action, "save");
  for (const smuggled of [{ partial: false }, { state: "Issued" }, { manifest_hash: "a".repeat(64) }, { approved_by: id() }, { gates: [] }]) refused(() => parseReleaseCommand({ ...release, ...smuggled }), Object.keys(smuggled)[0]);
  refused(() => parseReleaseCommand({ ...release, excluded: [{ key: "block-b" }] }), "excluded-0"); // what is held back always has its reason
  refused(() => parseReleaseCommand({ ...release, excluded: [{ key: "block-a", reason: "SYN both" }] }), "included", /appears once/);
  refused(() => parseReleaseCommand({ ...head(), action: "approve", record_id: id(), release_id: id(), expected_version: 3 }), "decision_reason");
  // A receiver's outcome cannot arrive with the request, and a returned pack always has an owner and a date.
  const decide = { ...head(), action: "decide", record_id: id(), handover_id: id(), submission_id: id(), expected_version: 1, outcome: "Accepted", outcome_reason: "SYN complete" };
  assert.equal(parseHandoverCommand(decide).action, "decide");
  refused(() => parseHandoverCommand({ ...decide, outcome_by: id() }), "outcome_by");
  refused(() => parseHandoverCommand({ ...decide, outcome: "Returned" }), "owner_id");
  refused(() => parseHandoverCommand({ ...decide, outcome: "Delivered" }), "outcome");
  refused(() => parseHandoverCommand({ ...decide, simulate_delivery: "Accepted" }), "simulate_delivery");
  refused(() => parseConfigurationCommand({ ...head(), action: "reconcile", record_id: id(), configuration_id: id(), expected_version: 2, decision_reason: "SYN agreed", state: "Reconciled" }), "state");
  refused(() => parseBasisCommand({ ...head(), action: "approve", record_id: id(), basis_id: id(), expected_version: 3, decision_reason: "SYN approved", independence_required: false }), "independence_required");
  // Every command carries its reason and a schema version this server knows.
  refused(() => parsePackageCommand({ ...create, reason: " " }), "reason");
  refused(() => parsePackageCommand({ ...create, schema_version: 2 }), "schema_version");
  refused(() => parsePackageCommand({ ...create, action: "release" }), "action");
});

test("EN08-02 EN08-08 EN08-10 EN08-28 a date says what it is a date of, a limit fits its precision, and a concern or an exclusion names its grounds", () => {
  const coordinate = { ...head(), action: "coordinate", record_id: id(), expected_version: 1, owner_id: id(), release_stage: "WholeScope" };
  refused(() => parsePackageCommand({ ...coordinate, due: "2026-10-01" }), "due_meaning", /Say what this date means/);
  refused(() => parsePackageCommand({ ...coordinate, due: "2026-10-01", due_meaning: "WarrantyStart" }), "due_meaning");
  refused(() => parsePackageCommand({ ...coordinate, due: "01/10/2026", due_meaning: "ReviewDue" }), "due");
  const dated = parsePackageCommand({ ...coordinate, due: "2026-10-01", due_meaning: "TestWindowCloses" }), undated = parsePackageCommand({ ...coordinate, due: null, due_meaning: "ReviewDue" });
  assert.deepEqual(dated.action === "coordinate" && [dated.due, dated.due_meaning], ["2026-10-01", "TestWindowCloses"]);
  assert.deepEqual(undated.action === "coordinate" && [undated.due, undated.due_meaning], [null, null]); // a meaning with no date is not kept as if it had one
  // Limits: stated to the precision the check accepts, as text, and in order. Equal limits are a legitimate single value.
  const numeric = (over: Record<string, unknown>) => basis([check({ numeric: { unit: "kPa", precision: 1, lower: "180.0", lower_inclusive: true, upper: "260.0", upper_inclusive: true, conversions: [], ...over } })]);
  refused(() => parseBasisCommand(numeric({ upper: "260.05" })), "checks-0", /stated to the precision the check accepts/);
  refused(() => parseBasisCommand(numeric({ lower: "180.25" })), "checks-0", /precision/);
  refused(() => parseBasisCommand(numeric({ lower: "260.1" })), "checks-0", /lower limit cannot exceed the upper limit/);
  refused(() => parseBasisCommand(numeric({ upper: 260 })), "checks-0", /plain decimal number as text/);
  refused(() => parseBasisCommand(numeric({ precision: 13 })), "checks-0");
  refused(() => parseBasisCommand(numeric({ tolerance: "5" })), "tolerance");
  refused(() => parseBasisCommand(numeric({ conversions: [{ from_unit: "bar" }] })), "checks-0", /conversion needs its factor/);
  const ok = parseBasisCommand(numeric({ lower: "200.0", upper: "200.0", conversions: [{ from_unit: "bar", multiply: "100" }] }));
  assert.deepEqual(ok.action === "save" && ok.checks[0].numeric, { unit: "kPa", precision: 1, lower: "200.0", lower_inclusive: true, upper: "200.0", upper_inclusive: true, conversions: [{ from_unit: "bar", multiply: "100", add: "0" }] });
  // A missing criterion is accepted as missing: the parser invents no limit and no default pass.
  const missing = parseBasisCommand(basis([check({ numeric: null })]));
  assert.equal(missing.action === "save" && missing.checks[0].numeric, null);
  refused(() => parseBasisCommand(basis([check({ check_type: "Qualitative", numeric: null, qualitative: { choices: ["Yes", "No"], accepted: ["Maybe"] } })])), "checks-0", /one of the approved choices/);
  refused(() => parseBasisCommand(basis([check({ condition: { statement: "SYN booster fitted", outcome: "Probably" } })])), "checks-0");
  refused(() => parseBasisCommand(basis([check(), check()])), "checks", /appears once/);
  refused(() => parseBasisCommand(basis([check({ passed: true })])), "passed");
  // A prerequisite's outcome is recorded on the attempt, never pre-set on the basis.
  refused(() => parseBasisCommand(basis([check()], { prerequisites: [{ key: "isolation", label: "SYN isolation", kind: "Isolation", mandatory: true, override: true }] })), "override");
  const prepared = parseBasisCommand(basis([check()], { prerequisites: [{ key: "isolation", label: "SYN isolation", kind: "Isolation", mandatory: true, met: true }] }));
  assert.equal(prepared.action === "save" && prepared.prerequisites[0].met, false);
  // A concern rests on a sourced constraint, and the constraint is not recorded without the concern it explains.
  const association = { ...head(), action: "association", record_id: id(), id: id(), expected_version: 1, kind: "LogicalAssignment", from_reference: "Valve V-12", to_reference: "Controller channel 6", source: "CFG-004 Rev B", effective_from: "2026-09-19T00:00:00.000Z", affected_checks: [] };
  assert.equal(parseConfigurationCommand(association).action, "association");
  refused(() => parseConfigurationCommand({ ...association, concern: "SYN two valves share a channel" }), "constraint_source", /names the sourced constraint/);
  refused(() => parseConfigurationCommand({ ...association, constraint_source: "CFG-004 Rev B: one valve per channel" }), "constraint_source");
  assert.equal(parseConfigurationCommand({ ...association, concern: "SYN two valves share a channel", constraint_source: "CFG-004 Rev B: one valve per channel" }).action, "association");
  refused(() => parseConfigurationCommand({ ...head(), action: "association_review", record_id: id(), association_id: id(), expected_version: 1, decision: "ReviewRequired", review_note: "SYN see concern", concern: "SYN moved" }), "constraint_source");
  // An excluded scope item carries its reason; an assessed shared interface carries its reasoning and joins at least two items.
  refused(() => parsePackageCommand(scope({ items: [item({ disposition: "Excluded" })] })), "items-0", /excluded scope item needs its reason/);
  refused(() => parsePackageCommand(scope({ items: [item({ disposition: "Excluded", exclusion_reason: "  " })] })), "items-0");
  const excluded = parsePackageCommand(scope({ items: [item({ disposition: "Excluded", exclusion_reason: "SYN not installed yet" })] }));
  assert.equal(excluded.action === "scope" && excluded.items[0].exclusion_reason, "SYN not installed yet");
  refused(() => parsePackageCommand(scope({ items: [item(), item()] })), "items", /appears once/);
  const shared = { key: "shared-pump", label: "SYN shared pump", items: ["block-a", "block-b"], assessment: "Independent", note: null };
  refused(() => parsePackageCommand(scope({ interfaces: [shared] })), "interfaces-0", /needs its reasoning/);
  refused(() => parsePackageCommand(scope({ interfaces: [{ ...shared, assessment: "Unassessed", items: ["block-a"] }] })), "interfaces-0");
  // A backup reference is a reference: a hash is a hash, and a credential or content field has nowhere to go.
  const backup = { ...head(), action: "backup", record_id: id(), id: id(), expected_version: 1, asset_reference: "CTL-01", purpose: "SYN recovery", configuration_version: "r4.2", native_format: "SYN archive", stored_reference: "SYN store/CTL-01", content_hash: "a".repeat(64), captured_at: "2026-09-14T03:00:00.000Z" };
  assert.equal(parseConfigurationCommand(backup).action, "backup");
  refused(() => parseConfigurationCommand({ ...backup, content_hash: "A".repeat(64) }), "content_hash");
  for (const smuggled of ["password", "content_base64", "identity_at"]) refused(() => parseConfigurationCommand({ ...backup, [smuggled]: "x" }), smuggled);
  refused(() => parseConfigurationCommand({ ...head(), action: "backup_verify", record_id: id(), backup_id: id(), expected_version: 1, fact: "everything", evidence: "SYN" }), "fact");
});
