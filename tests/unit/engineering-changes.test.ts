import assert from "node:assert/strict";
import test from "node:test";
import {
  applicability, attention, attentionPresentation, categoryProblems, changesPath, closureBlockers, csvCell, duePresentation, implementationProgress, knownCostImpact, nextAction,
  overlapsBlockingHandover, policyAllows, prerequisiteFrom, requestBlockers, scopeCompleteness, sourceCondition, sourcePresentation, stagePresentation, submitBlockers, decisionChip, decisionPresentation, receivingPresentation,
  assessmentCategories, type AffectedObject, type CategoryFinding, type ChangeFacts, type ClosureFacts, type HandoverContext, type Policy, type ProposalDocument, type SourceLink,
} from "../../src/engineering/changes/model";

const snapshot = { reference: "E-201", revision: "C", file_version: "1.0", content_hash: "a".repeat(64), permitted_purpose: "Procurement" as const, observed_at: "2026-09-20T05:30:00.000Z" };
const link = (over: Partial<SourceLink> = {}, live: Partial<NonNullable<SourceLink["live"]>> | null = {}): SourceLink => ({
  source_id: "s1", role: "Baseline", required: true, snapshot, live: live === null ? null : { use: "Current", successor_id: null, content_hash: snapshot.content_hash, readable: true, ...live }, ...over,
});
const facts = (over: Partial<ChangeFacts> = {}): ChangeFacts => ({
  stage: "DecisionRecorded", decision: "Accepted", source: "Current", return_kind: null, evidence_needed: false, prerequisites: [], requests: [], verification: [],
  requires_revised_release: false, revised_release_issued: false, overlap_conflict: false, context_kind: "Project", ...over,
});
const context = (over: Partial<HandoverContext> = {}): HandoverContext => ({ ...facts(), decision_purpose: "Procurement", issued_purpose: "Procurement", partial: false, ...over });
const assessed = (key: CategoryFinding["key"], over: Partial<CategoryFinding> = {}): CategoryFinding => ({ key, status: "Assessed", impact: "Impact", finding: "Assessed finding", reason: null, evidence: "SYN evidence", owner_id: "owner", ...over });
const everyCategory = () => assessmentCategories.map(([key]) => assessed(key));
const object = (over: Partial<AffectedObject> = {}): AffectedObject => ({
  id: "o1", object_type: "InstalledAsset", object_id: null, object_key: "InstalledAsset:PUMP-01", reference: "PUMP-01", title: "Duty pump", current_state: null, proposed_effect: "Controller interface rewired",
  relation: "Shown on E-201", disposition: "Included", exclusion_reason: null, finding: null, evidence: null, owner_id: null, next_action: null, location: "Irrigation Shed 01", served_areas: ["Greenhouse 01", "Nursery pad 02", "Propagation house 01"], supply_state: null, ...over,
});
const document = (over: Partial<ProposalDocument> = {}): ProposalDocument => ({
  rationale: "SYN the interface module is superseded", proposed_reference: "E-201", proposed_revision: "D", scope_statement: null, comparison: [{ attribute: "Interface module", unit: null, current: "CI-100", proposed: "CI-120", note: null }],
  options: [{ key: "adopt", kind: "AdoptProposed", label: "Adopt", assumptions: null, impacts: null, evidence: null }], selected_option: "adopt", categories: everyCategory(), costs: [], dates: [],
  objects: [object()], sources: [{ source_id: "s1", role: "Baseline", required: true }], retests: [{ id: "r1", criterion: "Interface handshake", requirement_ref: null, asset_or_system: "Control interface", configuration: "CI-120 r2", procedure_source_id: null, reason: "Changed interface", verifier_id: null, due: null }],
  requires_revised_release: true, ...over,
});

test("EN07-A53 one condition has one tone, icon and label; Decision recorded stays neutral and green is the positive fact only", () => {
  assert.deepEqual(stagePresentation.InReview, { label: "In review", tone: "information", icon: "info" });
  assert.deepEqual(attentionPresentation.ReviewRequired, { label: "Review required", tone: "information", icon: "info" });
  assert.equal(stagePresentation.DecisionRecorded.tone, "neutral");
  for (const code of ["SourceChanged", "CostReview", "ScopeClarification", "EvidenceNeeded", "ReceivingReturned"] as const) assert.equal(attentionPresentation[code].tone, "caution", code);
  assert.equal(attentionPresentation.RetestFailed.tone, "failure");
  assert.equal(attentionPresentation.AssessmentNeeded.tone, "neutral");
  assert.equal(decisionPresentation("Accepted").tone, "positive");
  assert.equal(decisionPresentation("Rejected").tone, "neutral");
  // Mockup r03 gives a condition its own glyph where it draws one; the tone, and so the colour, is unchanged by it.
  assert.deepEqual([stagePresentation.Draft.icon, stagePresentation.Assessing.icon, stagePresentation.DecisionRecorded.icon, stagePresentation.Returned.icon], ["clock", "progress", "document", "error"]);
  assert.deepEqual([stagePresentation.Returned.tone, attentionPresentation.AssessmentNeeded.icon, attentionPresentation.CostReview.icon], ["caution", "info", "warning"]);
  // The chip beside the review state names which decision it is. An undecided change has no chip; a rejection is not red or green.
  assert.deepEqual(decisionChip("Accepted"), { label: "Technical accepted", tone: "positive", icon: "tick" });
  assert.deepEqual([decisionChip("Rejected")?.tone, decisionChip("None")], ["neutral", null]);
  assert.equal(receivingPresentation.Pending.tone, "information");
  // A future date is neutral, a missing one is "Date needed" and never overdue; overdue says so in words.
  assert.deepEqual(duePresentation(null, "2026-09-20", true), { label: "Date needed", tone: "neutral", icon: "dot" });
  assert.equal(duePresentation("2026-09-22", "2026-09-20", true).tone, "neutral");
  assert.deepEqual(duePresentation("2026-09-19", "2026-09-20", true), { label: "Overdue", tone: "failure", icon: "error" });
  assert.equal(duePresentation("2026-09-19", "2026-09-20", false).tone, "neutral");
});

test("EN07-A54 currentness is derived from the required source set and never claimed when it cannot be established", () => {
  assert.equal(sourceCondition([link()], null).condition, "Current");
  assert.equal(sourceCondition([], null).condition, "NotCaptured");
  assert.equal(sourceCondition([link({}, { use: "Superseded", successor_id: "s2" })], null).condition, "Changed");
  // The successor the change itself asked for is its expected result, not a surprise.
  assert.equal(sourceCondition([link({}, { use: "Superseded", successor_id: "s2" })], "s2").condition, "Current");
  assert.equal(sourceCondition([link({}, { use: "Withdrawn" })], null).condition, "Withdrawn");
  assert.equal(sourceCondition([link({}, { use: "Unavailable" })], null).condition, "Unavailable");
  assert.equal(sourceCondition([link({}, null)], null).condition, "Unavailable");
  assert.equal(sourceCondition([link({}, { readable: false })], null).condition, "Restricted");
  assert.equal(sourceCondition([link({}, { content_hash: "b".repeat(64) })], null).condition, "Changed");
  // An optional source that changed does not move the indicator; a required evidence source does.
  assert.equal(sourceCondition([link(), link({ source_id: "s3", role: "Evidence", required: false }, { use: "Superseded", successor_id: "s4" })], null).condition, "Current");
  assert.equal(sourceCondition([link(), link({ source_id: "s3", role: "Evidence" }, { use: "Superseded", successor_id: "s4" })], null).condition, "Changed");
  // Withdrawal outranks a newer revision, and only "Current" is the positive presentation.
  assert.equal(sourceCondition([link({}, { use: "Superseded", successor_id: "s2" }), link({ source_id: "s3", role: "Evidence" }, { use: "Withdrawn" })], null).condition, "Withdrawn");
  assert.deepEqual(Object.entries(sourcePresentation).filter(([, v]) => v.tone === "positive").map(([k]) => k), ["Current"]);
  assert.equal(applicability("Changed"), "ReassessmentRequired");
  assert.equal(applicability("Restricted"), "EvidenceUnavailable");
});

test("EN07-A14 an empty, unavailable or unassessed category is never a reasoned no impact", () => {
  assert.equal(categoryProblems([]).length, 9);
  assert.ok(categoryProblems([]).filter((p) => ["function", "interfaces", "materials", "installed", "site", "retest"].includes(p.key)).every((p) => p.blocking));
  const na = everyCategory().map((c) => (c.key === "site" ? { ...c, status: "NotApplicable" as const, impact: null, reason: null } : c));
  assert.match(categoryProblems(na)[0].message, /not applicable.*reason/);
  const noImpact = everyCategory().map((c) => (c.key === "installed" ? { ...c, impact: "NoImpact" as const, reason: null } : c));
  assert.match(categoryProblems(noImpact)[0].message, /no impact.*rationale/);
  assert.deepEqual(categoryProblems(everyCategory().map((c) => (c.key === "installed" ? { ...c, impact: "NoImpact" as const, reason: "SYN no asset is touched" } : c))), []);
  // An unknown cost may stay open through technical review only while it is visibly owned.
  const unknownCost = (owner_id: string | null) => everyCategory().map((c) => (c.key === "cost" ? { ...c, status: "EvidenceNeeded" as const, impact: null, owner_id } : c));
  assert.equal(categoryProblems(unknownCost("owner"))[0].blocking, false);
  assert.equal(categoryProblems(unknownCost(null))[0].blocking, true);
  // The same gap in a technical category always blocks.
  assert.equal(categoryProblems(everyCategory().map((c) => (c.key === "interfaces" ? { ...c, status: "EvidenceNeeded" as const, impact: null } : c)))[0].blocking, true);
  assert.equal(scopeCompleteness({ categories: everyCategory(), objects: [object()] }, "Current").complete, true);
  assert.equal(scopeCompleteness({ categories: everyCategory(), objects: [object({ disposition: "Candidate" })] }, "Current").complete, false);
  assert.equal(scopeCompleteness({ categories: everyCategory(), objects: [object()] }, "Restricted").complete, false);
});

test("EN07-A20 known cost components sum only inside one currency, tax basis and kind; unknown is never zero", () => {
  const c = (key: string, amount: string | null, over = {}) => ({ key, label: key, kind: "Cost" as const, amount, currency: "AUD", tax_basis: "ExTax" as const, observed_on: null, source: null, confidence: null, ...over });
  const summary = knownCostImpact([c("module", "1250.50"), c("labour", "0.25"), c("remobilisation", null), c("freight", "90", { currency: "USD" }), c("resale", "2000", { kind: "Price" }), c("gst", "110", { tax_basis: "IncTax" })]);
  assert.deepEqual(summary.groups.map((g) => [g.kind, g.currency, g.tax_basis, g.known]), [["Cost", "AUD", "ExTax", "1250.75"], ["Cost", "USD", "ExTax", "90.00"], ["Price", "AUD", "ExTax", "2000.00"], ["Cost", "AUD", "IncTax", "110.00"]]);
  assert.deepEqual(summary.unknown, ["remobilisation"]);
  assert.equal(summary.complete, false);
  assert.equal(knownCostImpact([]).complete, false);
  assert.equal(knownCostImpact([c("credit", "-12.5")]).groups[0].known, "-12.50");
});

test("submission needs the exact basis, every category answered, decided objects, a retest where one is assessed and an independent reviewer", () => {
  const reviewers = [{ discipline: "Controls", required: true }];
  assert.deepEqual(submitBlockers(document(), reviewers, "Controls", "Current"), []);
  assert.match(submitBlockers(document({ sources: [] }), reviewers, "Controls", "Current").join(" "), /exact baseline/);
  assert.match(submitBlockers(document({ objects: [object({ disposition: "Candidate" })] }), reviewers, "Controls", "Current").join(" "), /include at least one[\s\S]*confirm this suggested object/);
  assert.match(submitBlockers(document({ retests: [] }), reviewers, "Controls", "Current").join(" "), /define at least one retest/);
  assert.match(submitBlockers(document(), reviewers, "Controls", "Changed").join(" "), /Source changed/);
  assert.match(submitBlockers(document(), [{ discipline: "Hydraulics", required: true }], "Controls", "Current").join(" "), /independent reviewer for Controls/);
  assert.match(submitBlockers(document({ selected_option: "other" }), reviewers, "Controls", "Current").join(" "), /select the one put forward/);
});

test("EN07-A25/A29/A13 technical acceptance is not implementation; investigation and release preparation never become an instruction", () => {
  const open = context({ prerequisites: [{ kind: "Commercial", applicability: "Required", state: "Open" }] });
  assert.match(requestBlockers("Implementation", open).join(" "), /Commercial review is outstanding/);
  assert.deepEqual(requestBlockers("ImpactReview", open), []);
  assert.deepEqual(requestBlockers("PrepareRevisedRelease", open), []);
  assert.deepEqual(requestBlockers("InformationRequired", context({ decision: "None", stage: "Assessing" })), []);
  assert.match(requestBlockers("PrepareRevisedRelease", context({ decision: "None", stage: "Assessing" })).join(" "), /accepted technical decision/);
  assert.match(requestBlockers("Implementation", context({ prerequisites: [{ kind: "Scheduling", applicability: "Unknown", state: "Open" }] })).join(" "), /Unknown applicability blocks/);
  assert.deepEqual(requestBlockers("Implementation", context({ prerequisites: [{ kind: "Commercial", applicability: "Required", state: "Confirmed" }, { kind: "Scheduling", applicability: "NotApplicable", state: "Open" }] })), []);
  // A coordination-only source or decision can never support procurement or installation.
  assert.match(requestBlockers("Implementation", context({ issued_purpose: "DesignCoordination" })).join(" "), /cannot be relabelled/);
  assert.match(requestBlockers("Implementation", context({ decision_purpose: "DesignCoordination" })).join(" "), /design coordination only/);
  assert.match(requestBlockers("Implementation", context({ requires_revised_release: true, revised_release_issued: false })).join(" "), /not the release itself/);
  assert.match(requestBlockers("Implementation", context({ context_kind: "Opportunity" })).join(" "), /awarded Project/);
  assert.match(requestBlockers("Implementation", context({ source: "Changed" })).join(" "), /retained as history/);
  assert.match(requestBlockers("Implementation", context({ overlap_conflict: true })).join(" "), /never merged automatically/);
  assert.match(requestBlockers("Implementation", context({ partial: true })).join(" "), /does not narrow the technical assessment/);
  assert.match(requestBlockers("ImpactReview", context({ stage: "Closed" })).join(" "), /successor change/);
});

test("EN07-A56 attention and the next action are derived from outstanding work and change when it does", () => {
  const costOpen = facts({ prerequisites: [{ kind: "Commercial", applicability: "Required", state: "Open" }], requests: [{ id: "q1", purpose: "ImpactReview", destination: "SupplyChain", state: "Pending" }], verification: ["Required"], requires_revised_release: true });
  assert.equal(attention(costOpen), "CostReview");
  assert.deepEqual(nextAction(costOpen), { code: "Commercial", label: "Open commercial review", view: "handovers", panel: "commercial" });
  const resolved = { ...costOpen, prerequisites: [{ kind: "Commercial" as const, applicability: "Required" as const, state: "Confirmed" as const }] };
  assert.equal(attention(resolved), "ReleaseNeeded");
  assert.equal(nextAction(resolved).label, "Review handover");
  assert.equal(attention(facts({ stage: "InReview", decision: "None" })), "ReviewRequired");
  assert.equal(nextAction(facts({ stage: "InReview", decision: "None" })).label, "Review findings");
  assert.equal(attention(facts({ stage: "Draft", decision: "None" })), "AssessmentNeeded");
  assert.equal(attention(facts({ stage: "Assessing", decision: "None", evidence_needed: true })), "EvidenceNeeded");
  assert.equal(attention(facts({ stage: "Assessing", decision: "None", source: "Changed" })), "SourceChanged");
  assert.equal(attention(facts({ stage: "Returned", decision: "None", return_kind: "ScopeClarification" })), "ScopeClarification");
  assert.equal(attention(facts({ verification: ["Failed"], requests: [{ id: "q", purpose: "Implementation", destination: "Service", state: "Accepted" }] })), "RetestFailed");
  assert.equal(nextAction(facts({ verification: ["Failed"] })).label, "Inspect retest");
  assert.equal(attention(facts({ stage: "Closed" })), "None");
  assert.equal(attention(facts({ decision: "Rejected" })), "ReadyToClose");
});

test("EN07-A32 mixed receiving outcomes stay separate and drive implementation progress", () => {
  const r = (destination: "SupplyChain" | "Service" | "Commissioning", state: "Pending" | "Accepted" | "Returned" | "Cancelled") => ({ id: destination, purpose: "Implementation" as const, destination, state });
  assert.equal(implementationProgress(facts()), "NotRequested");
  assert.equal(implementationProgress(facts({ requests: [r("SupplyChain", "Pending")] })), "Requested");
  assert.equal(implementationProgress(facts({ requests: [r("SupplyChain", "Accepted"), r("Service", "Pending")] })), "PartlyAccepted");
  assert.equal(implementationProgress(facts({ requests: [r("SupplyChain", "Accepted"), r("Service", "Returned")] })), "Returned");
  assert.equal(attention(facts({ requests: [r("SupplyChain", "Accepted"), r("Service", "Returned")] })), "ReceivingReturned");
  assert.equal(implementationProgress(facts({ requests: [r("SupplyChain", "Accepted"), r("Service", "Cancelled")], verification: ["Required"] })), "VerificationRequired");
  assert.equal(implementationProgress(facts({ requests: [r("SupplyChain", "Accepted")], verification: ["Passed", "NotRequired"] })), "Complete");
});

test("EN07-A41/A42 closure checks the whole change; no-implementation closure accounts for issued and accepted work", () => {
  const closing = (over: Partial<ClosureFacts> = {}): ClosureFacts => ({ ...facts({ requests: [{ id: "q", purpose: "Implementation", destination: "Service", state: "Accepted" }], verification: ["Passed"] }), acknowledgements_outstanding: 0, corrective_open: 0, as_built_required: false, as_built_reference: null, ...over });
  assert.deepEqual(closureBlockers("Implemented", closing()), []);
  assert.match(closureBlockers("Implemented", closing({ verification: ["Failed"], corrective_open: 1 })).join(" "), /must pass[\s\S]*Corrective work/);
  assert.match(closureBlockers("Implemented", closing({ requests: [] })).join(" "), /No implementation handover exists/);
  assert.match(closureBlockers("Implemented", closing({ requests: [{ id: "q", purpose: "Implementation", destination: "Service", state: "Accepted" }, { id: "p", purpose: "ImpactReview", destination: "SupplyChain", state: "Pending" }] })).join(" "), /no evidenced outcome/);
  assert.match(closureBlockers("Implemented", closing({ requires_revised_release: true })).join(" "), /no retained issue reference/);
  assert.match(closureBlockers("Implemented", closing({ as_built_required: true })).join(" "), /as-built evidence/);
  assert.match(closureBlockers("Implemented", closing({ source: "Withdrawn" })).join(" "), /not current for the closure/);
  assert.match(closureBlockers("NoImplementation", closing()).join(" "), /closed as implemented, or withdrawn first/);
  assert.deepEqual(closureBlockers("NoImplementation", closing({ decision: "Rejected", requests: [], verification: [] })), []);
  assert.match(closureBlockers("NoImplementation", closing({ stage: "Withdrawn", acknowledgements_outstanding: 1 })).join(" "), /accepted obligations are not erased/);
  assert.match(closureBlockers("NoImplementation", closing({ stage: "Withdrawn", decision: "None", verification: [], requests: [{ id: "p", purpose: "ImpactReview", destination: "SupplyChain", state: "Pending" }] })).join(" "), /Cancel each with its reason/);
  assert.deepEqual(closureBlockers("Implemented", closing({ stage: "Closed" })), ["This change is already closed."]);
});

test("EN07-A23 an absent or out-of-scope policy blocks; a role label grants nothing", () => {
  const policy: Policy = { id: "p", policy_version: 3, grants: [{ actor_id: "drew", role: "TechnicalAuthority", disciplines: ["Controls"], destinations: [] }, { actor_id: "robin", role: "Receiver", disciplines: [], destinations: ["SupplyChain"] }] };
  assert.match(policyAllows(null, "drew", "TechnicalAuthority")!, /^Authority not configured/);
  assert.equal(policyAllows(policy, "drew", "TechnicalAuthority", { discipline: "Controls" }), null);
  assert.match(policyAllows(policy, "drew", "TechnicalAuthority", { discipline: "Hydraulics" })!, /does not cover Hydraulics/);
  assert.match(policyAllows(policy, "alex", "TechnicalAuthority")!, /version 3.*does not name you/);
  assert.match(policyAllows(policy, "robin", "Receiver", { destination: "Service" })!, /does not cover Service/);
});

test("prerequisites follow the cost and dates findings; overlap blocks only against an accepted or restricted change", () => {
  assert.equal(prerequisiteFrom(undefined).applicability, "Unknown");
  assert.equal(prerequisiteFrom(assessed("cost", { impact: "NoImpact", reason: "SYN like for like" })).applicability, "NotApplicable");
  assert.deepEqual(prerequisiteFrom(assessed("cost")), { applicability: "Required", reason: "Assessed finding", owner_id: "owner" });
  assert.equal(prerequisiteFrom(assessed("cost", { status: "EvidenceNeeded", impact: null })).applicability, "Required");
  const other = { change_id: "c2", reference: "SYN-EN07-002", title: "Pump duty", stage: "Assessing" as const, decision: "None" as const, shared: [], restricted: false };
  assert.equal(overlapsBlockingHandover([other], new Set()).length, 0);
  assert.equal(overlapsBlockingHandover([{ ...other, stage: "DecisionRecorded", decision: "Accepted" }], new Set()).length, 1);
  assert.equal(overlapsBlockingHandover([{ ...other, stage: "DecisionRecorded", decision: "Accepted" }], new Set(["c2"])).length, 0);
  assert.equal(overlapsBlockingHandover([{ ...other, restricted: true }], new Set()).length, 1);
  assert.equal(overlapsBlockingHandover([{ ...other, stage: "Closed", decision: "Accepted" }], new Set()).length, 0);
});

test("EN07-A47 CSV neutralises formula-leading text, and only package-scoped change routes resolve a destination", () => {
  assert.equal(csvCell("=HYPERLINK(1)"), `"'=HYPERLINK(1)"`);
  assert.equal(csvCell('say "hi"'), `"say ""hi"""`);
  assert.equal(csvCell(null), `""`);
  assert.equal(changesPath("/engineering/abc/changes/reviews")?.view?.id, "reviews");
  assert.equal(changesPath("/engineering/abc/changes")?.view?.id, "register");
  assert.deepEqual(changesPath("/engineering/changes"), { package_id: null, view: undefined });
  assert.equal(changesPath("/engineering/abc/changes/unknown"), undefined);
  assert.equal(changesPath("/engineering/abc/materials"), undefined);
});
