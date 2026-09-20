// EN-08 Commissioning Basis & As-Built Release (principal requirement ENG-07). Types and pure rules only:
// nothing here reads a database, a clock or a browser, so one rule decides a screen label, a server refusal
// and a unit test. Every record is synthetic and every limit fictional. A technical release is a bounded
// engineering fact: it completes no Project, authorises no site operation, starts no warranty, books nobody,
// controls no equipment and closes no commercial obligation. Those stay separate facts with separate owners.
import { commissioningViews, commissioningHref, commissioningModuleLabel, commissioningPath, commissioningRecordHref, type CommissioningViewId } from "../../shell/navigation";
import { coverageComplete, type Applicability, type Coverage, type ReviewState } from "../../inspections/model";
export { commissioningViews, commissioningHref, commissioningModuleLabel, commissioningPath, commissioningRecordHref, type CommissioningViewId };

// ---------------------------------------------------------------------------------------------
// State dimensions (build plan r02, section 10.1). Each is its own retained fact; the package workflow is a
// navigation summary derived from them and is never an authority of its own.
export const workflows = ["Draft", "Preparing", "Testing", "InReview", "FollowUpRequired", "TechnicallyReleased", "Archived"] as const;
export type Workflow = (typeof workflows)[number];
export const basisStates = ["Draft", "InReview", "ApprovedForTest", "Returned", "Superseded"] as const;
export type BasisState = (typeof basisStates)[number];
export const reconciliationStates = ["Unassessed", "DifferencesOpen", "UnderReview", "Reconciled"] as const;
export type ReconciliationState = (typeof reconciliationStates)[number];
export const releaseStates = ["Draft", "InReview", "ApprovedForIssue", "Issued", "Withdrawn", "Superseded"] as const;
export type ReleaseState = (typeof releaseStates)[number];
export const receivingStates = ["NotRequested", "Requested", "InReview", "Returned", "ClarificationRequired", "Accepted", "OutcomeUnknown", "Unavailable"] as const;
export type ReceivingState = (typeof receivingStates)[number];
export const receivingOutcomes = ["Accepted", "Returned", "ClarificationRequired"] as const;
export type ReceivingOutcome = (typeof receivingOutcomes)[number];
export const destinations = ["Service", "Equipment", "Projects"] as const;
export type Destination = (typeof destinations)[number];
export const sourceConditions = ["Current", "ReassessmentRequired", "Unavailable", "Restricted", "NotCaptured"] as const;
export type SourceCondition = (typeof sourceConditions)[number];

export const dueMeanings = ["ReviewDue", "TestWindowCloses", "ReleaseTarget", "HandoverTarget"] as const;
export const releaseStages = ["WholeScope", "StagedArea"] as const;
export const approvalPurposes = ["CommissioningTest", "AsBuiltIssue"] as const;
export const scopeKinds = ["System", "Area", "Asset"] as const;
export type ScopeKind = (typeof scopeKinds)[number];
export const identityStates = ["Verified", "Unverified", "Unknown"] as const;
export type ScopeItem = {
  key: string; kind: ScopeKind; asset_id: string | null; reference: string; title: string; installed_location: string | null; served_areas: string[];
  disposition: "Included" | "Excluded"; exclusion_reason: string | null; identity: (typeof identityStates)[number]; critical: boolean;
};
// An interface shared by several scope items. It is assessed before any of them is released on its own.
export type SharedInterface = { key: string; label: string; items: string[]; assessment: "Unassessed" | "Independent" | "Blocking"; note: string | null };

export const redlineStates = ["Recorded", "UnderReview", "ClarificationRequired", "AcceptedForIncorporation", "Rejected", "IncorporatedVerified"] as const;
export type RedlineState = (typeof redlineStates)[number];
export const redlineClasses = ["Clerical", "Material"] as const;
export const redlineOpen = (s: RedlineState) => s !== "Rejected" && s !== "IncorporatedVerified";
export const differenceDispositions = ["Open", "Matches", "AcceptedAsBuilt", "ReferredToChange", "RejectedCorrectionRequired"] as const;
export type DifferenceDisposition = (typeof differenceDispositions)[number];
export const comparisonKinds = ["Identity", "Location", "ServedArea", "Material", "Version", "Drawing", "Setting"] as const;
export const associationKinds = ["PhysicalConnection", "LogicalAssignment", "ServedArea"] as const;
export const associationStates = ["Proposed", "Confirmed", "ReviewRequired", "Superseded"] as const;
export type AssociationState = (typeof associationStates)[number];
export const obligationKinds = ["Training", "Manual", "BackupReference", "SupportContext", "WarrantyMaintenance", "Hold", "Other"] as const;
export type ObligationKind = (typeof obligationKinds)[number];
// Where an obligation bites. Not every training task blocks every technical release: its stage is declared.
export const requiredStages = ["TestPrerequisite", "TechnicalIssue", "CustomerHandover", "ServiceAcceptance"] as const;
export type RequiredStage = (typeof requiredStages)[number];
export const obligationStates = ["Open", "Planned", "Delivered", "EvidenceRecorded", "CompetenceConfirmed", "Complete", "Dispositioned"] as const;
export type ObligationState = (typeof obligationStates)[number];
export const obligationSatisfied = (s: ObligationState) => s === "EvidenceRecorded" || s === "CompetenceConfirmed" || s === "Complete" || s === "Dispositioned";
export const policyRoles = ["Performer", "BasisApprover", "EvidenceReviewer", "AsBuiltApprover", "Issuer", "Receiver", "SourceAssessor"] as const;
export type PolicyRole = (typeof policyRoles)[number];

const labels: Record<string, string> = {
  InReview: "In review", FollowUpRequired: "Follow-up required", TechnicallyReleased: "Technically released", ApprovedForTest: "Approved for test", DifferencesOpen: "Differences open",
  UnderReview: "Under review", ApprovedForIssue: "Approved for issue", NotRequested: "Not requested", ClarificationRequired: "Clarification required", OutcomeUnknown: "Outcome unknown",
  ReassessmentRequired: "Reassessment required", NotCaptured: "Basis needed", ReviewDue: "Review due", TestWindowCloses: "Test window closes", ReleaseTarget: "Release target",
  HandoverTarget: "Handover target", WholeScope: "Whole declared scope", StagedArea: "Staged area or system", CommissioningTest: "Commissioning test", AsBuiltIssue: "As-built issue",
  AcceptedForIncorporation: "Accepted for incorporation", IncorporatedVerified: "Incorporated and verified", AcceptedAsBuilt: "Accepted as built", ReferredToChange: "Referred to change review (EN-07)",
  RejectedCorrectionRequired: "Rejected: physical correction required", ServedArea: "Served area", PhysicalConnection: "Physical connection", LogicalAssignment: "Logical assignment",
  ReviewRequired: "Review required", BackupReference: "Configuration backup reference", SupportContext: "Support context", WarrantyMaintenance: "Warranty and maintenance context",
  TestPrerequisite: "Before testing", TechnicalIssue: "Before technical issue", CustomerHandover: "Before customer handover", ServiceAcceptance: "Before Service acceptance",
  EvidenceRecorded: "Evidence recorded", CompetenceConfirmed: "Competence confirmed", BasisApprover: "Test basis approver", EvidenceReviewer: "Evidence reviewer", AsBuiltApprover: "As-built approver",
  SourceAssessor: "Source assessor", Hold: "Site or technical hold", Equipment: "Equipment (installed base)", Service: "Service", Projects: "Projects (PJ-09)",
};
export const label = (value: string) => labels[value] ?? value.replace(/([a-z])([A-Z])/g, "$1 $2");

// ---------------------------------------------------------------------------------------------
// Semantic formatting (plan 5.4). One typed mapping from a condition to its words, tone and small outline
// icon, so the same condition always looks the same. Green is an established positive fact and nothing else:
// "Not requested" is neutral and carries no tick; "Decision recorded" is neutral because it may be a rejection.
export type Tone = "neutral" | "information" | "caution" | "failure" | "positive";
export type TagIcon = "tick" | "tick-circle" | "clock" | "alert" | "error" | "document" | "target" | "unsent" | "none";
export type Presentation = { label: string; tone: Tone; icon: TagIcon };
const tag = (text: string, tone: Tone, icon: TagIcon): Presentation => ({ label: text, tone, icon });
export const basisPresentation: Record<BasisState | "None", Presentation> = {
  None: tag("No test basis", "neutral", "document"), Draft: tag("Draft", "neutral", "document"), InReview: tag("In review", "information", "clock"),
  ApprovedForTest: tag("Approved for test", "positive", "tick"), Returned: tag("Returned", "caution", "alert"), Superseded: tag("Superseded", "neutral", "document"),
};
export const reviewPresentation: Record<ReviewState, Presentation> = {
  NotSubmitted: tag("Not submitted", "neutral", "document"), InReview: tag("In review", "information", "clock"), Accepted: tag("Evidence accepted", "positive", "tick"),
  Returned: tag("Returned", "caution", "alert"), ClarificationRequired: tag("Clarification required", "caution", "alert"), OnHold: tag("On hold", "caution", "alert"),
};
export const evaluationPresentation = {
  Pass: tag("Passed", "positive", "tick"), Fail: tag("Failed", "failure", "error"), NotTested: tag("Not tested", "neutral", "target"),
  NotApplicable: tag("Not applicable", "neutral", "document"), UnableToAssess: tag("Unable to assess", "neutral", "document"),
} as const;
export const applicabilityPresentation: Record<Applicability, Presentation> = {
  Current: tag("Current for scope", "positive", "tick"), ReassessmentRequired: tag("Reassessment required", "caution", "alert"), Unavailable: tag("Currentness not established", "caution", "alert"), HistoricalOnly: tag("Historical only", "neutral", "document"),
};
export const reconciliationPresentation: Record<ReconciliationState, Presentation> = {
  Unassessed: tag("Unassessed", "neutral", "document"), DifferencesOpen: tag("Differences open", "caution", "alert"), UnderReview: tag("Under review", "information", "clock"), Reconciled: tag("Reconciled", "positive", "tick"),
};
export const redlinePresentation: Record<RedlineState, Presentation> = {
  Recorded: tag("Recorded", "neutral", "document"), UnderReview: tag("Under review", "information", "clock"), ClarificationRequired: tag("Clarification required", "caution", "alert"),
  // Accepted for incorporation is not an issued as-built: it stays a caution until a verified successor exists.
  AcceptedForIncorporation: tag("Pending incorporation", "caution", "alert"), Rejected: tag("Rejected", "neutral", "document"), IncorporatedVerified: tag("Incorporated and verified", "positive", "tick"),
};
export const releasePresentation: Record<ReleaseState | "None", Presentation> = {
  None: tag("Draft", "neutral", "document"), Draft: tag("Draft", "neutral", "document"), InReview: tag("In review", "information", "clock"), ApprovedForIssue: tag("Ready to issue", "information", "clock"),
  Issued: tag("Released", "positive", "tick-circle"), Withdrawn: tag("Withdrawn", "neutral", "document"), Superseded: tag("Superseded", "neutral", "document"),
};
export const receivingPresentation: Record<ReceivingState, Presentation> = {
  NotRequested: tag("Not requested", "neutral", "unsent"), Requested: tag("Requested", "information", "clock"), InReview: tag("In review", "information", "clock"), Returned: tag("Returned", "caution", "alert"),
  ClarificationRequired: tag("Clarification required", "caution", "alert"), Accepted: tag("Accepted", "positive", "tick"), OutcomeUnknown: tag("Outcome unknown", "caution", "alert"), Unavailable: tag("Receiver unavailable", "caution", "alert"),
};
export const obligationPresentation: Record<ObligationState, Presentation> = {
  Open: tag("Outstanding", "caution", "alert"), Planned: tag("Planned", "neutral", "target"), Delivered: tag("Delivered", "information", "clock"), EvidenceRecorded: tag("Evidence recorded", "positive", "tick"),
  CompetenceConfirmed: tag("Competence confirmed", "positive", "tick"), Complete: tag("Complete", "positive", "tick-circle"), Dispositioned: tag("Decision recorded", "neutral", "document"),
};
export const sourcePresentation: Record<SourceCondition, Presentation> = {
  Current: tag("Sources current", "positive", "tick"), ReassessmentRequired: tag("Source changed", "caution", "alert"), Unavailable: tag("Currentness not established", "caution", "alert"),
  Restricted: tag("Source restricted", "neutral", "document"), NotCaptured: tag("Basis needed", "neutral", "document"),
};
export const workflowPresentation: Record<Workflow, Presentation> = {
  Draft: tag("Draft", "neutral", "document"), Preparing: tag("Preparing", "neutral", "document"), Testing: tag("Testing", "neutral", "target"), InReview: tag("In review", "information", "clock"),
  FollowUpRequired: tag("Follow-up required", "caution", "alert"), TechnicallyReleased: tag("Technically released", "positive", "tick-circle"), Archived: tag("Archived", "neutral", "document"),
};
// A future date is neutral, a missing one is "Date needed", and neither is overdue. Overdue says so in words.
export function duePresentation(due: string | null, today: string, open: boolean): Presentation {
  if (!due) return tag("Date needed", "neutral", "none");
  return open && due < today ? tag("Overdue", "failure", "error") : tag("Due", "neutral", "none");
}
// The register's Test evidence cell: explicit counts, with the worst real condition named first. Never a percentage.
export function evidencePresentation(c: Coverage, attempts: number): Presentation {
  if (c.reassessment) return tag("Reassessment", "caution", "alert");
  if (c.failed) return tag(`${c.failed} failed check${c.failed === 1 ? "" : "s"}`, "failure", "error");
  if (c.required && c.criteria_missing && attempts) return tag("Unable to assess", "neutral", "document");
  if (!attempts) return tag("Not started", "neutral", "target");
  if (coverageComplete(c)) return tag(`${c.accepted} / ${c.required} accepted`, "positive", "tick");
  if (c.unassessable) return tag("Unable to assess", "neutral", "document");
  return tag(`${c.accepted} / ${c.required} accepted`, c.passed_unreviewed ? "information" : "neutral", c.passed_unreviewed ? "clock" : "target");
}

// ---------------------------------------------------------------------------------------------
// What the register, inspector and gates derive for one commissioning package.
export type ObligationFact = { id: string; kind: ObligationKind; title: string; stage: RequiredStage; state: ObligationState; owner_name: string | null };
export type PackageFacts = {
  archived: boolean; basis: BasisState | "None"; basis_in_review: boolean; coverage: Coverage; attempts: number; attempts_in_review: number; attempts_returned: number;
  defects_open: number; reconciliation: ReconciliationState; differences_open: number; referred_open: number; redlines_review: number; redlines_to_incorporate: number;
  associations_review: number; identity_unverified_critical: number; backups_unverified: number; holds_open: number; source: SourceCondition;
  release: ReleaseState | "None"; release_partial: boolean; release_applicability: Applicability; candidate_ready: boolean;
  obligations: ObligationFact[]; receiving: { destination: Destination; state: ReceivingState }[];
};
export function workflow(f: PackageFacts): Workflow {
  if (f.archived) return "Archived";
  if (f.release === "Issued") return f.release_applicability === "Current" && !f.receiving.some((r) => r.state === "Returned") ? "TechnicallyReleased" : "FollowUpRequired";
  // Once testing is complete, an as-built that still has owned work outstanding is follow-up, not "testing".
  const asBuiltOutstanding = coverageComplete(f.coverage) && (f.redlines_to_incorporate > 0 || f.differences_open > 0 || f.referred_open > 0);
  if (f.defects_open || f.attempts_returned || f.source === "ReassessmentRequired" || f.basis === "Returned" || asBuiltOutstanding) return "FollowUpRequired";
  if (f.release === "InReview" || f.release === "ApprovedForIssue" || f.attempts_in_review || f.basis_in_review || f.reconciliation === "UnderReview" || f.redlines_review > 0) return "InReview";
  if (f.basis === "ApprovedForTest") return "Testing";
  return f.basis === "None" ? "Draft" : "Preparing";
}
export const outstandingFor = (f: Pick<PackageFacts, "obligations">, stages: RequiredStage[]) => f.obligations.filter((o) => stages.includes(o.stage) && !obligationSatisfied(o.state));

// The most relevant blocker or the next permitted step. A blocker is a condition and is shown as one; an
// ordinary next step is plain words. Opening either navigates: it approves, issues and completes nothing.
export type NextRequirement = { code: string; label: string; kind: "condition" | "step"; tone: Tone; action: string; view: CommissioningViewId; panel: string | null };
export function nextRequirement(f: PackageFacts): NextRequirement {
  const condition = (code: string, text: string, action: string, view: CommissioningViewId, panel: string | null = null, tone: Tone = "caution"): NextRequirement => ({ code, label: text, kind: "condition", tone, action, view, panel });
  const step = (code: string, text: string, action: string, view: CommissioningViewId, panel: string | null = null): NextRequirement => ({ code, label: text, kind: "step", tone: "neutral", action, view, panel });
  if (f.archived) return step("History", "View history", "View history", "handovers", "history");
  if (f.release === "Issued") {
    const service = f.receiving.find((r) => r.destination === "Service"), returned = f.receiving.find((r) => r.state === "Returned" || r.state === "ClarificationRequired");
    if (f.release_applicability !== "Current") return condition("SourceChanged", "Source changed", "Review source change", "releases", "sources");
    if (returned) return condition("HandoverReturned", "Handover returned", "Open Service handover", "handovers");
    const training = outstandingFor(f, ["CustomerHandover", "ServiceAcceptance"]);
    if (training.some((o) => o.kind === "Training")) return condition("TrainingRequired", "Training required", "Open Service handover", "handovers", "obligations");
    if (training.length) return condition("ObligationOpen", `${training.length} obligation${training.length === 1 ? "" : "s"} open`, "Open Service handover", "handovers", "obligations");
    if (!service || service.state === "NotRequested") return step("RequestHandover", "Request Service handover", "Open Service handover", "handovers");
    if (service.state === "OutcomeUnknown" || service.state === "Unavailable") return condition("ReceivingUnknown", label(service.state), "Open Service handover", "handovers");
    if (service.state !== "Accepted") return step("AwaitReceiving", "Handover pending", "Open Service handover", "handovers");
    return step("History", "View history", "View history", "handovers", "history");
  }
  if (f.source === "ReassessmentRequired") return f.associations_review ? step("ReviewMapping", "Review mapping", "Review mapping", "configuration", "associations") : condition("SourceChanged", "Source changed", "Review source change", "basis", "sources");
  if (f.source === "Unavailable") return condition("SourceUnavailable", "Currentness not established", "Review source check", "basis", "sources");
  if (f.coverage.criteria_missing) return condition("CriteriaMissing", "Criteria missing", "Complete test basis", "basis");
  if (f.basis === "None" || f.basis === "Draft" || f.basis === "Returned") return step("CompleteBasis", f.basis === "Returned" ? "Correct test basis" : "Complete test basis", "Complete test basis", "basis");
  if (f.basis === "InReview") return step("ApproveBasis", "Approve test basis", "Review test basis", "basis");
  if (f.defects_open || f.coverage.failed) return condition("RetestRequired", "Retest required", "Open retest", "results", "defects");
  if (f.attempts_returned) return condition("EvidenceReturned", "Evidence returned", "Open retest", "results");
  if (f.attempts_in_review) return step("ReviewEvidence", "Review test evidence", "Review test evidence", "results");
  if (f.backups_unverified && !f.attempts) return step("VerifyBackup", "Verify backup", "Verify backup", "configuration", "backups");
  if (!coverageComplete(f.coverage)) return step("Test", f.attempts ? "Complete testing" : "Start testing", "Record test attempt", "results");
  if (f.redlines_review) return condition("RedlineReview", `${f.redlines_review} redline${f.redlines_review === 1 ? "" : "s"} in review`, "Resolve redlines", "configuration", "redlines");
  if (f.redlines_to_incorporate) return condition("RedlineOpen", `${f.redlines_to_incorporate} redline${f.redlines_to_incorporate === 1 ? "" : "s"} open`, "Resolve redlines", "configuration", "redlines");
  if (f.differences_open || f.referred_open) return condition("DifferencesOpen", "Differences open", "Reconcile configuration", "configuration");
  if (f.associations_review) return step("ReviewMapping", "Review mapping", "Review mapping", "configuration", "associations");
  if (f.reconciliation !== "Reconciled") return step("Reconcile", "Reconcile configuration", "Reconcile configuration", "configuration");
  const blocking = outstandingFor(f, ["TechnicalIssue"]);
  if (blocking.length) return condition("ObligationOpen", blocking[0].kind === "Training" ? "Training required" : `${label(blocking[0].kind)} outstanding`, "Review as-built package", "releases", "obligations");
  if (f.release === "ApprovedForIssue") return step("Issue", "Issue approved release", "Issue approved release", "releases");
  if (f.release === "InReview") return step("ReviewRelease", f.release_partial ? "Review partial scope" : "Review as-built package", "Review as-built package", "releases");
  return step("PrepareRelease", f.release_partial ? "Review partial scope" : "Prepare as-built release", "Review as-built package", "releases");
}
// The register's As-built cell. A released package whose source later changed still shows that it was
// released; the concern is a separate, visible condition.
export function asBuiltPresentation(f: PackageFacts): Presentation {
  if (f.release === "Issued" || f.release === "Withdrawn" || f.release === "Superseded") return releasePresentation[f.release];
  if (f.source === "ReassessmentRequired") return sourcePresentation.ReassessmentRequired;
  if (f.release === "InReview" || f.release === "ApprovedForIssue") return releasePresentation[f.release];
  if (f.candidate_ready) return tag("Ready for review", "information", "clock");
  if (f.redlines_review || f.redlines_to_incorporate || f.reconciliation === "UnderReview") return coverageComplete(f.coverage) ? tag("In review", "information", "clock") : releasePresentation.Draft;
  return releasePresentation.Draft;
}

// ---------------------------------------------------------------------------------------------
// Release gates (plan 10.2). Eight named gates over the exact selected scope. A partial scope satisfies its
// own complete rule set; none of these can be cleared by a general administrative override.
export type Gate = { key: string; label: string; satisfied: boolean; reasons: string[] };
export type GateFacts = PackageFacts & {
  partial: boolean; scope_selected: number; scope_excluded_without_reason: number; shared_unresolved: string[]; manifest_complete: boolean; recipients_named: boolean;
  reviewer_refusal: string | null; criteria_source_current: boolean;
};
export function releaseGates(f: GateFacts): Gate[] {
  const gate = (key: string, text: string, reasons: (string | false | null)[]): Gate => { const r = reasons.filter((x): x is string => !!x); return { key, label: text, satisfied: r.length === 0, reasons: r }; };
  const c = f.coverage, issueStage = outstandingFor(f, ["TestPrerequisite", "TechnicalIssue"]);
  return [
    gate("basis", "Approved procedure, criteria and technical basis", [
      f.basis !== "ApprovedForTest" && "The test basis is not approved for test.", c.criteria_missing > 0 && `${c.criteria_missing} required check${c.criteria_missing === 1 ? " has" : "s have"} no acceptance criterion.`,
      f.source !== "Current" && `${sourcePresentation[f.source].label}: a release decision rests on sources whose currentness is established.`]),
    gate("scope", "Asset, installation and served-area scope", [
      f.scope_selected === 0 && "No scope is selected for this release.", f.scope_excluded_without_reason > 0 && "Every excluded scope item needs its reason.",
      f.identity_unverified_critical > 0 && `${f.identity_unverified_critical} critical asset${f.identity_unverified_critical === 1 ? " is" : "s are"} not verified. An unknown identity never becomes a verified asset in a released as-built.`,
      ...f.shared_unresolved.map((s) => `${s}: this shared interface is not assessed as independent, so part of what it joins cannot be released alone.`)]),
    gate("evidence", "Required checks, accepted evidence and retests", [
      c.required === 0 && "No required check is defined for this scope.", c.failed > 0 && `${c.failed} required check${c.failed === 1 ? "" : "s"} failed.`, c.not_tested > 0 && `${c.not_tested} required check${c.not_tested === 1 ? " is" : "s are"} not tested.`,
      c.unassessable > 0 && `${c.unassessable} required check${c.unassessable === 1 ? "" : "s"} could not be assessed.`, c.passed_unreviewed > 0 && `${c.passed_unreviewed} passing result${c.passed_unreviewed === 1 ? " has" : "s have"} no accepted evidence review.`,
      c.reassessment > 0 && `${c.reassessment} accepted result${c.reassessment === 1 ? " needs" : "s need"} reassessment for the present configuration.`, f.defects_open > 0 && `${f.defects_open} defect${f.defects_open === 1 ? " is" : "s are"} open.`]),
    gate("configuration", "Reconciled installed configuration and redlines", [
      f.reconciliation !== "Reconciled" && `Configuration is ${label(f.reconciliation).toLowerCase()}.`, f.differences_open > 0 && `${f.differences_open} difference${f.differences_open === 1 ? " is" : "s are"} open.`,
      f.referred_open > 0 && `${f.referred_open} difference${f.referred_open === 1 ? " is" : "s are"} with change review. A request is not a resolution.`, f.redlines_review > 0 && `${f.redlines_review} redline${f.redlines_review === 1 ? " is" : "s are"} still in review.`,
      f.redlines_to_incorporate > 0 && `${f.redlines_to_incorporate} redline${f.redlines_to_incorporate === 1 ? " is" : "s are"} accepted for incorporation and not yet incorporated into a verified successor.`,
      f.associations_review > 0 && `${f.associations_review} sensor, valve or area association${f.associations_review === 1 ? " needs" : "s need"} review.`]),
    // An obligation blocks the stage it declares and no other: training required for Service acceptance does not stop a technical issue.
    gate("obligations", "Holds, change impacts and obligations for this stage", [f.holds_open > 0 && `${f.holds_open} mandatory hold${f.holds_open === 1 ? " is" : "s are"} open.`,
      ...issueStage.filter((o) => !supportKinds.includes(o.kind)).map((o) => `${o.title}: required ${label(o.stage).toLowerCase()} and ${obligationPresentation[o.state].label.toLowerCase()}.`)]),
    gate("support", "Manuals, backup references, training and support context", [
      ...issueStage.filter((o) => supportKinds.includes(o.kind)).map((o) => `${o.title}: required ${label(o.stage).toLowerCase()} and ${obligationPresentation[o.state].label.toLowerCase()}.`),
      f.backups_unverified > 0 && `${f.backups_unverified} configuration backup reference${f.backups_unverified === 1 ? " has" : "s have"} no verified identity. A backup that exists is not a backup that was verified.`]),
    gate("authority", "Eligible reviewer, policy and independence", [f.reviewer_refusal]),
    gate("manifest", "Output manifest, audience, sources and recipients", [!f.manifest_complete && "The output manifest is incomplete.", !f.recipients_named && "Name the required recipients of this release."]),
  ];
}
const supportKinds: ObligationKind[] = ["Manual", "BackupReference", "SupportContext", "WarrantyMaintenance"];
export const gateBlockers = (gates: Gate[]) => gates.flatMap((g) => g.reasons);

// A handover's receiving state is read from its own request. No request is "Not requested" only where none
// exists; a receiver that could not be reached is unknown, never accepted and never "not requested".
export function receivingState(request: { latest_outcome: ReceivingOutcome | null; delivery: "Delivered" | "Pending" | "Unknown" | "Unavailable" } | null): ReceivingState {
  if (!request) return "NotRequested";
  if (request.latest_outcome) return request.latest_outcome;
  return request.delivery === "Unknown" ? "OutcomeUnknown" : request.delivery === "Unavailable" ? "Unavailable" : "Requested";
}

// ---------------------------------------------------------------------------------------------
// Authority. A role label grants nothing: the versioned synthetic policy names actors, an absent policy
// never falls back to permissive behaviour, and the capability and the policy both have to agree.
export type PolicyGrant = { actor_id: string; role: PolicyRole; destinations: Destination[] };
export type Policy = { id: string; policy_version: number; independence: { basis: boolean; evidence: boolean; as_built: boolean }; grants: PolicyGrant[] } | null;
export function policyAllows(policy: Policy, actor: string, role: PolicyRole, scope: { destination?: Destination } = {}): string | null {
  if (!policy) return "Authority not configured: no commissioning policy covers this company and site.";
  const grant = policy.grants.find((g) => g.actor_id === actor && g.role === role && (!scope.destination || g.destinations.includes(scope.destination)));
  if (!grant) return `The configured policy (version ${policy.policy_version}) does not name you as ${label(role).toLowerCase()}${scope.destination ? ` for ${label(scope.destination)}` : ""}.`;
  return null;
}

// Exports. A cell that a spreadsheet would run as a formula is neutralised; every field is quoted.
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}
export const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
