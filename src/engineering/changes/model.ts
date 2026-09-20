// EN-07 Engineering Change-Impact Review (parent ENG-06). Types and pure rules only: nothing here reads a
// database, a clock or a browser, so the same rule decides a screen label, a server refusal and a unit
// test. Every record is synthetic. A technical acceptance is a bounded engineering decision: it never
// issues a drawing, releases material, approves cost, amends a purchase, instructs site work, moves a
// booking or accepts commissioning. Those stay separate facts with separate owners.

export const changeViews = [
  { id: "register", label: "Change register", segment: "" },
  { id: "impact", label: "Impact assessment", segment: "impact" },
  { id: "reviews", label: "Review & decisions", segment: "reviews" },
  { id: "handovers", label: "Actions & handovers", segment: "handovers" },
  { id: "verification", label: "Retest & verification", segment: "verification" },
  { id: "history", label: "Changes & history", segment: "history" },
] as const;
export type ChangeViewId = (typeof changeViews)[number]["id"];
export const changesModuleLabel = "Engineering Change-Impact Review";
export const changesHref = (packageId: string, view: ChangeViewId = "register", changeId?: string | null) => {
  const segment = changeViews.find((v) => v.id === view)!.segment;
  return `/engineering/${packageId}/changes${segment ? `/${segment}` : ""}${changeId ? `?change=${changeId}` : ""}`;
};
// The entry page has no destination; an unknown segment answers nothing rather than pretending to be the register.
export function changesPath(path: string) {
  const match = /^\/engineering\/(?:([^/]+)\/)?changes(?:\/([a-z]+))?\/?$/.exec(path);
  if (!match) return undefined;
  const view = match[1] ? changeViews.find((v) => v.segment === (match[2] ?? "")) : undefined;
  return match[1] && !view ? undefined : { package_id: match[1] ?? null, view };
}

// ---------------------------------------------------------------------------------------------
// State families (build plan r02, section 10.1). One badge never stands for the whole process.
export const stages = ["Draft", "Assessing", "InReview", "Returned", "DecisionRecorded", "Closed", "Withdrawn"] as const;
export type Stage = (typeof stages)[number];
export const revisionStates = ["Working", "Submitted", "Returned", "Decided"] as const;
export type RevisionState = (typeof revisionStates)[number];
export const decisionResults = ["Accepted", "Rejected"] as const;
export type TechnicalDecision = "None" | (typeof decisionResults)[number];
export const applicabilities = ["Current", "ReassessmentRequired", "EvidenceUnavailable"] as const;
export type Applicability = (typeof applicabilities)[number];
export const progressStates = ["NotRequested", "Requested", "PartlyAccepted", "Returned", "InProgress", "VerificationRequired", "Complete"] as const;
export type ImplementationProgress = (typeof progressStates)[number];
export const receivingOutcomes = ["Pending", "Accepted", "Returned", "Declined", "Cancelled"] as const;
export type ReceivingOutcome = (typeof receivingOutcomes)[number];
export const verificationStates = ["NotRequired", "Required", "AwaitingEvidence", "Failed", "Passed"] as const;
export type VerificationState = (typeof verificationStates)[number];

// Reason categories are local design choices of this prototype, not an assertion of company policy.
export const changeCategories = ["DesignCorrection", "RequirementChange", "SupplierProductChange", "SiteDiscrepancy", "InterfaceConflict", "FieldRedline"] as const;
export type ChangeCategory = (typeof changeCategories)[number];
// The application's existing priority choices (tickets, 0001). Urgency grants no authority and bypasses no review.
export const priorities = ["Low", "Normal", "High", "Urgent"] as const;
export const returnKinds = ["ScopeClarification", "EvidenceNeeded", "Correction"] as const;
export type ReturnKind = (typeof returnKinds)[number];
export const decisionPurposes = ["DesignCoordination", "Procurement", "Installation"] as const;
export type DecisionPurpose = (typeof decisionPurposes)[number];

export const assessmentCategories = [
  ["function", "Technical function and performance", true],
  ["interfaces", "Interfaces", true],
  ["materials", "Materials and supply", true],
  ["installed", "Installed configuration", true],
  ["site", "Work method and site constraints", true],
  ["retest", "Retest and verification", true],
  ["cost", "Cost", false],
  ["dates", "Dates and commitments", false],
  ["recipients", "Recipients", false],
] as const;
export type CategoryKey = (typeof assessmentCategories)[number][0];
export const categoryStatuses = ["Assessed", "NotApplicable", "EvidenceNeeded", "NotAssessed"] as const;
export type CategoryStatus = (typeof categoryStatuses)[number];
export type CategoryFinding = {
  key: CategoryKey; status: CategoryStatus; impact: "Impact" | "NoImpact" | null;
  finding: string | null; reason: string | null; evidence: string | null; owner_id: string | null;
};

export const objectTypes = ["Requirement", "Interface", "DrawingIssue", "MaterialLine", "MaterialRelease", "Product", "SupplyObservation", "InstalledAsset", "Milestone", "JobPack", "Test"] as const;
export type ObjectType = (typeof objectTypes)[number];
export const dispositions = ["Candidate", "Included", "Excluded"] as const;
export type Disposition = (typeof dispositions)[number];
// Ordered, shipped, arrived, received, inspected, usable, quarantined and returned are different observations.
export const supplyStates = ["Ordered", "Shipped", "Arrived", "Received", "Inspected", "Usable", "Quarantined", "Returned"] as const;
export type AffectedObject = {
  id: string; object_type: ObjectType; object_id: string | null; object_key: string; reference: string; title: string;
  current_state: string | null; proposed_effect: string | null; relation: string; disposition: Disposition;
  exclusion_reason: string | null; finding: string | null; evidence: string | null; owner_id: string | null;
  next_action: string | null; location: string | null; served_areas: string[]; supply_state: (typeof supplyStates)[number] | null;
};

export const optionKinds = ["RetainCurrent", "AdoptProposed", "StagedAlternative"] as const;
export type ChangeOption = { key: string; kind: (typeof optionKinds)[number]; label: string; assumptions: string | null; impacts: string | null; evidence: string | null };
export type ComparisonRow = { attribute: string; unit: string | null; current: string | null; proposed: string | null; note: string | null };
export const dateMeanings = ["RequestedDate", "SupplierPromise", "ProjectForecast", "CustomerWindow", "ConfirmedAppointment"] as const;
export type DateEffect = { key: string; label: string; meaning: (typeof dateMeanings)[number]; current: string | null; proposed_effect: string; owner_id: string | null };

export const sourceRoles = ["Baseline", "Evidence", "TestProcedure", "Commercial", "Configuration"] as const;
export type SourceRole = (typeof sourceRoles)[number];
export const sourceUses = ["Current", "Superseded", "Withdrawn", "Unavailable", "Restricted"] as const;
export type SourceUse = (typeof sourceUses)[number];
export const sourcePurposes = ["Procurement", "DesignCoordination", "InformationOnly"] as const;
export type SourcePurpose = (typeof sourcePurposes)[number];

export const requestPurposes = ["InformationRequired", "ImpactReview", "PrepareRevisedRelease", "Implementation", "Amendment"] as const;
export type RequestPurpose = (typeof requestPurposes)[number];
export const destinations = ["TechnicalRelease", "Materials", "SupplyChain", "Projects", "Service", "Commissioning", "DocumentControl"] as const;
export type Destination = (typeof destinations)[number];
export const prerequisiteKinds = ["Commercial", "Scheduling"] as const;
export type PrerequisiteKind = (typeof prerequisiteKinds)[number];
export const prerequisiteApplicabilities = ["Required", "NotApplicable", "Unknown"] as const;
export const prerequisiteStates = ["Open", "Confirmed", "Declined"] as const;
export type Prerequisite = { kind: PrerequisiteKind; applicability: (typeof prerequisiteApplicabilities)[number]; state: (typeof prerequisiteStates)[number] };
export const closureMeanings = ["Implemented", "NoImplementation"] as const;
export const policyRoles = ["DisciplineReviewer", "TechnicalAuthority", "CommercialReviewer", "Receiver", "Verifier", "Closer"] as const;
export type PolicyRole = (typeof policyRoles)[number];

const labels: Record<string, string> = {
  InReview: "In review", DecisionRecorded: "Decision recorded", ReassessmentRequired: "Reassessment required", EvidenceUnavailable: "Evidence unavailable",
  NotRequested: "Not requested", PartlyAccepted: "Partly accepted", InProgress: "In progress", VerificationRequired: "Verification required",
  NotRequired: "Not required", AwaitingEvidence: "Awaiting evidence", DesignCorrection: "Design correction", RequirementChange: "Requirement change",
  SupplierProductChange: "Supplier or product change", SiteDiscrepancy: "Site or as-found discrepancy", InterfaceConflict: "Interface conflict",
  FieldRedline: "Field redline", ScopeClarification: "Scope clarification", EvidenceNeeded: "Evidence needed", NotApplicable: "Not applicable",
  NotAssessed: "Not yet assessed", NoImpact: "No impact", DesignCoordination: "Design coordination only", InformationOnly: "Information only",
  DrawingIssue: "Drawing issue", MaterialLine: "Material line", MaterialRelease: "Material release", SupplyObservation: "Supply observation",
  InstalledAsset: "Installed asset", JobPack: "Job pack", RetainCurrent: "Retain current design", AdoptProposed: "Adopt the proposed change",
  StagedAlternative: "Investigate a staged alternative", RequestedDate: "Requested date", SupplierPromise: "Supplier promise", ProjectForecast: "Project forecast",
  CustomerWindow: "Customer window", ConfirmedAppointment: "Confirmed appointment", TestProcedure: "Test procedure",
  InformationRequired: "Information required", ImpactReview: "Impact review requested", PrepareRevisedRelease: "Prepare revised technical release",
  Implementation: "Implementation handover", Amendment: "Amendment or withdrawal review", TechnicalRelease: "Technical release (EN-05)",
  Materials: "Released materials (EN-06)", SupplyChain: "Supply Chain", Projects: "Projects", Service: "Service", Commissioning: "Commissioning (EN-08)",
  DocumentControl: "Document control", NoImplementation: "No implementation", DisciplineReviewer: "Discipline reviewer",
  TechnicalAuthority: "Technical decision authority", CommercialReviewer: "Commercial reviewer", Closer: "Change closer",
  NoBlockingFinding: "No blocking finding", BlockingFinding: "Blocking finding", ReturnForClarification: "Returned for clarification",
};
export const label = (value: string) => labels[value] ?? value.replace(/([a-z])([A-Z])/g, "$1 $2");

// ---------------------------------------------------------------------------------------------
// Semantic formatting (section 5.3.1). One typed mapping from a domain condition to its label, tone and
// icon, so the same condition always looks the same. A tone is never an extra hidden rule: an overdue or
// blocking condition carries its own words. "Decision recorded" stays neutral because the decision
// underneath may be an acceptance or a rejection; green belongs only to the exact positive fact.
export type Tone = "neutral" | "information" | "caution" | "failure" | "positive";
export type ToneIcon = "dot" | "info" | "warning" | "error" | "check";
export type Presentation = { label: string; tone: Tone; icon: ToneIcon };
const tone = (text: string, t: Tone): Presentation => ({ label: text, tone: t, icon: ({ neutral: "dot", information: "info", caution: "warning", failure: "error", positive: "check" } as const)[t] });
export const stagePresentation: Record<Stage, Presentation> = {
  Draft: tone("Draft", "neutral"), Assessing: tone("Assessing", "neutral"), InReview: tone("In review", "information"),
  Returned: tone("Returned", "caution"), DecisionRecorded: tone("Decision recorded", "neutral"), Closed: tone("Closed", "neutral"), Withdrawn: tone("Withdrawn", "neutral"),
};
export const attentionCodes = [
  "RetestFailed", "SourceWithdrawn", "SourceChanged", "SourceUnavailable", "OverlapConflict", "ReceivingReturned", "ScopeClarification", "EvidenceNeeded",
  "CorrectionNeeded", "ReviewRequired", "CostReview", "ScheduleReview", "ReleaseNeeded", "HandoverNeeded", "ReceivingAwaited", "RetestRequired",
  "ReadyToClose", "AssessmentNeeded", "None",
] as const;
export type AttentionCode = (typeof attentionCodes)[number];
export const attentionPresentation: Record<AttentionCode, Presentation> = {
  RetestFailed: tone("Retest failed", "failure"), SourceWithdrawn: tone("Source withdrawn", "caution"), SourceChanged: tone("Source changed", "caution"),
  SourceUnavailable: tone("Source unavailable", "caution"), OverlapConflict: tone("Overlapping change", "caution"), ReceivingReturned: tone("Receiving returned", "caution"),
  ScopeClarification: tone("Scope clarification", "caution"), EvidenceNeeded: tone("Evidence needed", "caution"), CorrectionNeeded: tone("Correction needed", "caution"),
  ReviewRequired: tone("Review required", "information"), CostReview: tone("Cost review", "caution"), ScheduleReview: tone("Schedule review", "caution"),
  ReleaseNeeded: tone("Revised release needed", "information"), HandoverNeeded: tone("Handover to prepare", "information"), ReceivingAwaited: tone("Receiving awaited", "information"),
  RetestRequired: tone("Retest required", "information"), ReadyToClose: tone("Ready to close", "information"), AssessmentNeeded: tone("Assessment needed", "neutral"),
  None: tone("No action needed", "neutral"),
};
export const decisionPresentation = (d: TechnicalDecision): Presentation => (d === "Accepted" ? tone("Accepted", "positive") : d === "Rejected" ? tone("Rejected", "neutral") : tone("Not decided", "neutral"));
export const receivingPresentation: Record<ReceivingOutcome, Presentation> = {
  Pending: tone("Awaiting response", "neutral"), Accepted: tone("Accepted", "positive"), Returned: tone("Returned", "caution"), Declined: tone("Declined", "caution"), Cancelled: tone("Cancelled", "neutral"),
};
export const verificationPresentation: Record<VerificationState | "TestBasisNeeded", Presentation> = {
  NotRequired: tone("Not required", "neutral"), Required: tone("Test pending", "neutral"), AwaitingEvidence: tone("Awaiting evidence", "neutral"),
  Failed: tone("Failed", "failure"), Passed: tone("Passed", "positive"), TestBasisNeeded: tone("Test basis needed", "caution"),
};
// A future due date is neutral and a missing one is "Date needed"; neither is overdue. Overdue says so in words.
export function duePresentation(due: string | null, today: string, open: boolean): Presentation {
  if (!due) return tone("Date needed", "neutral");
  return open && due < today ? tone("Overdue", "failure") : tone("Due", "neutral");
}

// ---------------------------------------------------------------------------------------------
// Source currentness. A snapshot records what was observed when the proposal was assessed and is never
// rewritten. Its present condition is derived from what the upstream adapter says now. A successor that
// the change itself asked for is the expected result of the change, not a surprise.
export type SourceSnapshot = { reference: string; revision: string; file_version: string; content_hash: string | null; permitted_purpose: SourcePurpose; observed_at: string };
export type SourceLink = {
  source_id: string; role: SourceRole; required: boolean; snapshot: SourceSnapshot;
  live: { use: SourceUse; successor_id: string | null; content_hash: string | null; readable: boolean } | null;
};
export const sourceConditions = ["Current", "Changed", "Withdrawn", "Unavailable", "Restricted", "NotCaptured"] as const;
export type SourceCondition = (typeof sourceConditions)[number];
export function sourceCondition(links: SourceLink[], expectedSuccessorId: string | null): { condition: SourceCondition; reasons: string[] } {
  const required = links.filter((l) => l.required);
  if (!required.some((l) => l.role === "Baseline")) return { condition: "NotCaptured", reasons: ["No exact baseline source is captured yet."] };
  const found: [SourceCondition, string][] = [];
  for (const l of required) {
    const name = `${l.snapshot.reference} revision ${l.snapshot.revision}`;
    if (!l.live) found.push(["Unavailable", `${name} can no longer be found through the upstream adapter.`]);
    else if (l.live.use === "Withdrawn") found.push(["Withdrawn", `${name} was withdrawn by its owner. Its history is retained; it cannot support new use.`]);
    else if (l.live.use === "Superseded" && !(l.role === "Baseline" && expectedSuccessorId && l.live.successor_id === expectedSuccessorId)) found.push(["Changed", `${name} has a newer revision that this assessment has not considered.`]);
    else if (l.live.use === "Unavailable") found.push(["Unavailable", `${name} could not be retrieved in full.`]);
    else if (l.live.use === "Restricted" || !l.live.readable) found.push(["Restricted", `${name} is restricted for this identity, so its currentness cannot be shown here.`]);
    else if (l.live.content_hash !== l.snapshot.content_hash) found.push(["Changed", `${name} no longer matches the content that was assessed.`]);
  }
  const order: SourceCondition[] = ["Withdrawn", "Changed", "Unavailable", "Restricted"];
  const worst = order.find((c) => found.some(([k]) => k === c));
  return { condition: worst ?? "Current", reasons: found.map(([, text]) => text) };
}
export const sourcePresentation: Record<SourceCondition, Presentation> = {
  Current: tone("Sources current", "positive"), Changed: tone("Source changed", "caution"), Withdrawn: tone("Source withdrawn", "caution"),
  Unavailable: tone("Source unavailable", "caution"), Restricted: tone("Source restricted", "neutral"), NotCaptured: tone("Baseline needed", "neutral"),
};
// A retained decision stays a historical fact. Whether it may still support a new handover is derived.
export const applicability = (c: SourceCondition): Applicability => (c === "Current" ? "Current" : c === "Changed" || c === "Withdrawn" ? "ReassessmentRequired" : "EvidenceUnavailable");

// ---------------------------------------------------------------------------------------------
// Exact money. Decimal strings with up to four fractional places on integer arithmetic. Known components
// are summed only inside one currency, tax basis and kind; a blank is unknown, never zero.
const moneyScale = 10000n;
export function parseMoney(value: string): bigint | null {
  const m = /^(-?)(\d{1,12})(?:\.(\d{1,4}))?$/.exec(value);
  if (!m) return null;
  const n = BigInt(m[2]) * moneyScale + BigInt((m[3] ?? "").padEnd(4, "0"));
  return m[1] ? -n : n;
}
export function formatMoney(value: bigint): string {
  const sign = value < 0n ? "-" : "", abs = value < 0n ? -value : value;
  const fraction = (abs % moneyScale).toString().padStart(4, "0").replace(/0{1,2}$/, "");
  return `${sign}${abs / moneyScale}.${fraction}`;
}
export const costKinds = ["Cost", "Price"] as const;
export const taxBases = ["ExTax", "IncTax"] as const;
export type CostComponent = {
  key: string; label: string; kind: (typeof costKinds)[number]; amount: string | null; currency: string;
  tax_basis: (typeof taxBases)[number]; observed_on: string | null; source: string | null; confidence: string | null;
};
export type CostSummary = { groups: { kind: string; currency: string; tax_basis: string; known: string; components: number }[]; unknown: string[]; complete: boolean };
export function knownCostImpact(components: CostComponent[]): CostSummary {
  const groups = new Map<string, { kind: string; currency: string; tax_basis: string; total: bigint; components: number }>(), unknown: string[] = [];
  for (const c of components) {
    const amount = c.amount === null ? null : parseMoney(c.amount);
    if (amount === null) { unknown.push(c.label); continue; }
    const key = `${c.kind}|${c.currency}|${c.tax_basis}`, g = groups.get(key) ?? { kind: c.kind, currency: c.currency, tax_basis: c.tax_basis, total: 0n, components: 0 };
    groups.set(key, { ...g, total: g.total + amount, components: g.components + 1 });
  }
  return { groups: [...groups.values()].map(({ total, ...g }) => ({ ...g, known: formatMoney(total) })), unknown, complete: unknown.length === 0 && components.length > 0 };
}

// ---------------------------------------------------------------------------------------------
// The proposal document and what stops it. Pure, so the screen's disabled reason, the server's refusal
// and the tests are one rule.
export type RetestDefinition = {
  id: string; criterion: string; requirement_ref: string | null; asset_or_system: string; configuration: string;
  procedure_source_id: string | null; reason: string; verifier_id: string | null; due: string | null;
};
export type ProposalDocument = {
  rationale: string | null; proposed_reference: string | null; proposed_revision: string | null; scope_statement: string | null;
  comparison: ComparisonRow[]; options: ChangeOption[]; selected_option: string | null; categories: CategoryFinding[];
  costs: CostComponent[]; dates: DateEffect[]; objects: AffectedObject[]; sources: { source_id: string; role: SourceRole; required: boolean }[];
  retests: RetestDefinition[]; requires_revised_release: boolean;
};
const technical = new Set<CategoryKey>(assessmentCategories.filter(([, , t]) => t).map(([k]) => k));
const categoryLabel = (key: CategoryKey) => assessmentCategories.find(([k]) => k === key)![1];
export function categoryProblems(categories: CategoryFinding[]): { key: CategoryKey; message: string; blocking: boolean }[] {
  const out: { key: CategoryKey; message: string; blocking: boolean }[] = [], byKey = new Map(categories.map((c) => [c.key, c]));
  for (const [key, name, isTechnical] of assessmentCategories) {
    const c = byKey.get(key);
    // An empty list is not evidence of no impact: every category is answered in words.
    if (!c || c.status === "NotAssessed") out.push({ key, message: `${name}: not yet assessed.`, blocking: isTechnical || !c?.owner_id });
    else if (c.status === "NotApplicable" && !c.reason?.trim()) out.push({ key, message: `${name}: “not applicable” needs its reason.`, blocking: true });
    else if (c.status === "Assessed" && (!c.impact || !c.finding?.trim())) out.push({ key, message: `${name}: record the finding, and whether it is an impact or a reasoned no impact.`, blocking: true });
    else if (c.status === "Assessed" && c.impact === "NoImpact" && !c.reason?.trim()) out.push({ key, message: `${name}: “no impact” needs the rationale that supports it.`, blocking: true });
    else if (c.status === "EvidenceNeeded") out.push({ key, message: `${name}: evidence is outstanding${c.owner_id ? "" : " and has no owner"}.`, blocking: isTechnical || !c.owner_id });
    // A cost or date impact is somebody else's decision. It may stay open through technical review only while it is visibly owned.
    else if ((key === "cost" || key === "dates") && c.status === "Assessed" && c.impact === "Impact" && !c.owner_id) out.push({ key, message: `${name}: name who owns the decision this impact needs.`, blocking: true });
  }
  return out;
}
// What the cost and dates findings mean for implementation once a change is technically accepted.
export function prerequisiteFrom(c: CategoryFinding | undefined): { applicability: (typeof prerequisiteApplicabilities)[number]; reason: string; owner_id: string | null } {
  if (!c || c.status === "NotAssessed") return { applicability: "Unknown", reason: "Whether this applies was not assessed before the technical decision. Its owner must say.", owner_id: c?.owner_id ?? null };
  if (c.status === "NotApplicable" || (c.status === "Assessed" && c.impact === "NoImpact")) return { applicability: "NotApplicable", reason: c.reason ?? "Assessed as no impact.", owner_id: null };
  return { applicability: "Required", reason: c.status === "EvidenceNeeded" ? `Part of this impact is unknown: ${c.finding ?? c.reason ?? "evidence is outstanding"}` : (c.finding ?? "An impact was assessed."), owner_id: c.owner_id };
}
export function scopeCompleteness(doc: Pick<ProposalDocument, "categories" | "objects">, source: SourceCondition) {
  const reasons = [
    ...categoryProblems(doc.categories).map((p) => p.message),
    ...doc.objects.filter((o) => o.disposition === "Candidate").map((o) => `${o.reference}: a suggested object is neither included nor excluded with a reason.`),
    ...(source === "Current" ? [] : [`${sourcePresentation[source].label}: a complete claim cannot rest on sources that are not current and readable.`]),
  ];
  return { complete: reasons.length === 0, reasons };
}
export function submitBlockers(doc: ProposalDocument, reviewers: { discipline: string; required: boolean }[], discipline: string, source: SourceCondition): string[] {
  const out: string[] = [];
  if (!doc.rationale?.trim()) out.push("Give the reason for the change in words before it is reviewed.");
  if (!doc.sources.some((s) => s.role === "Baseline" && s.required)) out.push("Capture the exact baseline: the approved or released source revision this change is measured against.");
  if (!doc.proposed_reference?.trim() || !doc.proposed_revision?.trim()) out.push("Name the proposed revision.");
  if (!doc.comparison.length) out.push("Record at least one compared attribute, current against proposed.");
  if (!doc.options.length || !doc.options.some((o) => o.key === doc.selected_option)) out.push("Document the options considered and select the one put forward.");
  if (!doc.objects.some((o) => o.disposition === "Included")) out.push("Identify the affected scope: include at least one affected object.");
  for (const o of doc.objects) {
    if (o.disposition === "Candidate") out.push(`${o.reference}: confirm this suggested object is included, or exclude it with a reason.`);
    if (o.disposition === "Excluded" && !o.exclusion_reason?.trim()) out.push(`${o.reference}: an exclusion needs its reason.`);
  }
  out.push(...categoryProblems(doc.categories).filter((p) => p.blocking).map((p) => p.message));
  const retest = doc.categories.find((c) => c.key === "retest");
  if (retest?.status === "Assessed" && retest.impact === "Impact" && !doc.retests.length) out.push("Retest is assessed as required, so define at least one retest obligation with its criterion and configuration.");
  if (source !== "Current") out.push(`${sourcePresentation[source].label}: review needs current, readable required sources.`);
  if (!reviewers.some((r) => r.required && r.discipline === discipline)) out.push(`Assign a required independent reviewer for ${discipline}.`);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Overlap. Two open or accepted changes that touch the same object may proceed together, but a
// conflicting proposed configuration needs an explicit compatibility or sequence decision before
// implementation. Nothing is merged or rebased automatically.
export type Overlap = { change_id: string; reference: string; title: string; stage: Stage; decision: TechnicalDecision; shared: { object_key: string; reference: string }[]; restricted: boolean };
export const overlapsBlockingHandover = (overlaps: Overlap[], resolved: ReadonlySet<string>) =>
  overlaps.filter((o) => (o.decision === "Accepted" || o.restricted) && !["Closed", "Withdrawn"].includes(o.stage) && !resolved.has(o.change_id));

// ---------------------------------------------------------------------------------------------
// What the register and inspector derive for one change.
export type RequestFact = { id: string; purpose: RequestPurpose; destination: Destination; state: ReceivingOutcome | "OutcomeUnknown" };
export type ChangeFacts = {
  stage: Stage; decision: TechnicalDecision; source: SourceCondition; return_kind: ReturnKind | null;
  evidence_needed: boolean; prerequisites: Prerequisite[]; requests: RequestFact[]; verification: VerificationState[];
  requires_revised_release: boolean; revised_release_issued: boolean; overlap_conflict: boolean; context_kind: "Project" | "Opportunity";
};
const openStages: Stage[] = ["Draft", "Assessing", "InReview", "Returned", "DecisionRecorded"];
export const isOpen = (stage: Stage) => openStages.includes(stage);
const live = (r: RequestFact) => r.state !== "Cancelled";
export function implementationProgress(f: ChangeFacts): ImplementationProgress {
  const work = f.requests.filter((r) => live(r) && r.purpose === "Implementation");
  if (!work.length) return "NotRequested";
  if (work.some((r) => r.state === "Returned" || r.state === "Declined")) return "Returned";
  const accepted = work.filter((r) => r.state === "Accepted").length;
  if (accepted < work.length) return accepted ? "PartlyAccepted" : "Requested";
  if (!f.verification.length || f.verification.every((v) => v === "Passed" || v === "NotRequired")) return "Complete";
  return f.verification.some((v) => v === "Failed") ? "InProgress" : "VerificationRequired";
}
export const prerequisitesOutstanding = (f: Pick<ChangeFacts, "prerequisites">) =>
  f.prerequisites.filter((p) => p.applicability === "Unknown" || (p.applicability === "Required" && p.state !== "Confirmed"));
// The most actionable reason first. Each is a concrete condition with its own words.
export function attention(f: ChangeFacts): AttentionCode {
  if (!isOpen(f.stage)) return "None";
  if (f.verification.includes("Failed")) return "RetestFailed";
  if (f.source === "Withdrawn") return "SourceWithdrawn";
  if (f.source === "Changed") return "SourceChanged";
  if (f.source === "Unavailable") return "SourceUnavailable";
  if (f.requests.some((r) => r.state === "Returned" || r.state === "Declined")) return "ReceivingReturned";
  if (f.stage === "Returned") return f.return_kind === "ScopeClarification" ? "ScopeClarification" : f.return_kind === "EvidenceNeeded" ? "EvidenceNeeded" : "CorrectionNeeded";
  if (f.stage === "InReview") return "ReviewRequired";
  if (f.stage === "Draft") return "AssessmentNeeded";
  if (f.stage === "Assessing") return f.evidence_needed ? "EvidenceNeeded" : "AssessmentNeeded";
  if (f.decision === "Rejected") return "ReadyToClose";
  const waiting = prerequisitesOutstanding(f);
  if (waiting.some((p) => p.kind === "Commercial")) return "CostReview";
  if (waiting.length) return "ScheduleReview";
  if (f.overlap_conflict) return "OverlapConflict";
  if (f.requires_revised_release && !f.revised_release_issued && !f.requests.some((r) => live(r) && r.purpose === "PrepareRevisedRelease")) return "ReleaseNeeded";
  const progress = implementationProgress(f);
  if (progress === "NotRequested") return f.requires_revised_release && !f.revised_release_issued ? "ReceivingAwaited" : "HandoverNeeded";
  if (progress === "Requested" || progress === "PartlyAccepted") return "ReceivingAwaited";
  if (progress === "VerificationRequired" || progress === "InProgress") return "RetestRequired";
  return "ReadyToClose";
}
// The nearest permitted action. It is derived from the outstanding work, so it changes when that work does.
// Opening any of these navigates; it approves, issues and completes nothing.
export type NextAction = { code: string; label: string; view: ChangeViewId; panel: string | null };
export function nextAction(f: ChangeFacts): NextAction {
  const to = (code: string, text: string, view: ChangeViewId, panel: string | null = null): NextAction => ({ code, label: text, view, panel });
  switch (attention(f)) {
    case "AssessmentNeeded": case "EvidenceNeeded": return f.stage === "Returned" ? to("Correct", "Correct and resubmit", "impact") : to("Assess", "Continue assessment", "impact");
    case "ScopeClarification": case "CorrectionNeeded": return to("Correct", "Correct and resubmit", "impact");
    case "SourceChanged": case "SourceWithdrawn": case "SourceUnavailable": return to("Sources", "Review source change", "impact", "sources");
    case "ReviewRequired": return to("Review", "Review findings", "reviews");
    case "CostReview": return to("Commercial", "Open commercial review", "handovers", "commercial");
    case "ScheduleReview": return to("Scheduling", "Open schedule review", "handovers", "scheduling");
    case "OverlapConflict": return to("Overlap", "Resolve overlapping change", "impact", "overlaps");
    case "ReleaseNeeded": case "HandoverNeeded": case "ReceivingAwaited": case "ReceivingReturned": return to("Handover", "Review handover", "handovers");
    case "RetestFailed": case "RetestRequired": return to("Retest", "Inspect retest", "verification");
    case "ReadyToClose": return to("Close", "Review closure", "verification", "closure");
    default: return to("History", "View history", "history");
  }
}

// ---------------------------------------------------------------------------------------------
// Implementation handover. Investigation and release-preparation requests have their own, lighter guards;
// they can never be relabelled as an instruction to implement.
export type HandoverContext = ChangeFacts & { decision_purpose: DecisionPurpose | null; issued_purpose: SourcePurpose | null; partial: boolean };
export function requestBlockers(purpose: RequestPurpose, f: HandoverContext): string[] {
  const out: string[] = [];
  if (!isOpen(f.stage)) return ["This change is closed or withdrawn. Later evidence is handled through a linked successor change."];
  if (purpose === "InformationRequired" || purpose === "ImpactReview") return out;
  if (f.decision !== "Accepted") out.push("A current accepted technical decision is needed first. An investigation request can be raised before one exists.");
  if (applicability(f.source) !== "Current") out.push(`${sourcePresentation[f.source].label}: the accepted decision is retained as history and cannot support a new handover until the change is reassessed.`);
  if (purpose === "PrepareRevisedRelease" || purpose === "Amendment") return out;
  for (const p of prerequisitesOutstanding(f)) out.push(p.applicability === "Unknown" ? `Whether a ${p.kind.toLowerCase()} decision applies is unknown. Unknown applicability blocks implementation.` : `${p.kind} review is outstanding with its owner. Technical acceptance does not settle it.`);
  if (f.context_kind !== "Project") out.push("This package belongs to an Opportunity, which is enquiry support. Implementation needs an awarded Project; nothing here pretends one exists.");
  if (f.decision_purpose === "DesignCoordination") out.push("The technical decision was recorded for design coordination only. It cannot support procurement or installation.");
  if (f.requires_revised_release && !f.revised_release_issued) out.push("The revised technical release has not been issued by its owner. A request to prepare it is not the release itself.");
  else if (f.issued_purpose && f.issued_purpose !== "Procurement") out.push(`The issued source permits ${label(f.issued_purpose).toLowerCase()}. A purpose cannot be relabelled here; the source owner issues it.`);
  if (f.overlap_conflict) out.push("Another accepted or restricted change shares this scope. Record a compatibility or sequence decision first; proposals are never merged automatically.");
  if (f.partial) out.push("Partial implementation needs an explicitly assessed independent child scope. Selecting a subset does not narrow the technical assessment.");
  return out;
}

// ---------------------------------------------------------------------------------------------
// Closure checks the whole declared change, never the visible page of a register.
export type ClosureFacts = ChangeFacts & { acknowledgements_outstanding: number; corrective_open: number; as_built_required: boolean; as_built_reference: string | null };
export function closureBlockers(meaning: (typeof closureMeanings)[number], f: ClosureFacts): string[] {
  const out: string[] = [], open = f.requests.filter((r) => r.state === "Pending" || r.state === "OutcomeUnknown");
  if (f.stage === "Closed") return ["This change is already closed."];
  if (meaning === "NoImplementation") {
    if (f.decision === "Accepted" && f.stage !== "Withdrawn") out.push("An accepted change is closed as implemented, or withdrawn first with its reason.");
    if (f.decision === "None" && f.stage !== "Withdrawn") out.push("Record the technical rejection, or withdraw the change, before closing without implementation.");
    if (open.length) out.push(`${open.length} issued request${open.length > 1 ? "s are" : " is"} unresolved. Cancel each with its reason, or obtain its outcome.`);
    const accepted = f.requests.filter((r) => r.state === "Accepted" && r.purpose === "Implementation").length;
    if (accepted && f.acknowledgements_outstanding) out.push("A receiver already accepted implementation work. Their acknowledgement of the withdrawal is required; accepted obligations are not erased.");
    return out;
  }
  if (f.decision !== "Accepted") out.push("Only an accepted technical change can be closed as implemented.");
  if (applicability(f.source) !== "Current") out.push(`${sourcePresentation[f.source].label}: the decision is not current for the closure being claimed.`);
  if (implementationProgress(f) === "NotRequested") out.push("No implementation handover exists. An accepted proposal with no implementation cannot be closed as implemented.");
  // A declined request is a final outcome with its reason. It leaves implementation unresolved only where no
  // other request to that destination was accepted in its place.
  const unresolved = f.requests.filter((r) => live(r) && (r.state === "Pending" || r.state === "Returned" || r.state === "OutcomeUnknown"
    || (r.state === "Declined" && r.purpose === "Implementation" && !f.requests.some((x) => x.purpose === "Implementation" && x.destination === r.destination && x.state === "Accepted"))));
  if (unresolved.length) out.push(`${unresolved.length} request${unresolved.length > 1 ? "s have" : " has"} no evidenced outcome. Obtain it, correct and resubmit, or cancel the request with its reason.`);
  if (f.requires_revised_release && !f.revised_release_issued) out.push("The required revised technical release has no retained issue reference.");
  if (prerequisitesOutstanding(f).length) out.push("A commercial or scheduling prerequisite is unresolved.");
  if (f.verification.some((v) => v !== "Passed" && v !== "NotRequired")) out.push("Every required retest must pass for the relevant configuration. A completed task or a photograph is not a pass.");
  if (f.corrective_open) out.push("Corrective work from a failed test is still open.");
  if (f.as_built_required && !f.as_built_reference?.trim()) out.push("The installed or as-built evidence and its EN-08 receiving reference are missing.");
  if (f.acknowledgements_outstanding) out.push("A required acknowledgement is missing. A notification attempt is not an acknowledgement.");
  return out;
}

// ---------------------------------------------------------------------------------------------
// Authority. A role label grants nothing: the versioned synthetic policy names actors, and an absent
// policy never falls back to permissive behaviour. The capability and the policy both have to agree.
export type PolicyGrant = { actor_id: string; role: PolicyRole; disciplines: string[]; destinations: Destination[] };
export type Policy = { id: string; policy_version: number; grants: PolicyGrant[] } | null;
export function policyAllows(policy: Policy, actor: string, role: PolicyRole, scope: { discipline?: string; destination?: Destination } = {}): string | null {
  if (!policy) return "Authority not configured: no change-review policy covers this company and site.";
  const grant = policy.grants.find((g) => g.actor_id === actor && g.role === role);
  if (!grant) return `The configured policy (version ${policy.policy_version}) does not name you as ${label(role).toLowerCase()}.`;
  if (scope.discipline && !grant.disciplines.includes(scope.discipline)) return `Your ${label(role).toLowerCase()} authority does not cover ${scope.discipline}.`;
  if (scope.destination && !grant.destinations.includes(scope.destination)) return `Your receiving authority does not cover ${label(scope.destination)}.`;
  return null;
}

// Exports. A cell that a spreadsheet would run as a formula is neutralised; every field is quoted.
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}
export const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
