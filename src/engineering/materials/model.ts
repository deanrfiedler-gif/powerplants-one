// EN-06 Released Materials & Substitutions (parent ENG-05). Types and pure rules only: nothing here
// reads a database, a clock or a browser, so the same rule decides a screen label, a server refusal
// and a unit test. Every record is synthetic. A technical release is never permission to spend,
// order, reserve, install or commission; those remain separate facts owned elsewhere.

export const materialViews = [
  { id: "register", label: "Materials register", segment: "" },
  { id: "mapping", label: "Item & unit mapping", segment: "mapping" },
  { id: "substitutions", label: "Substitution review", segment: "substitutions" },
  { id: "releases", label: "Review & release", segment: "releases" },
  { id: "handover", label: "Supply handover", segment: "handover" },
  { id: "history", label: "Changes & history", segment: "history" },
] as const;
export type MaterialViewId = (typeof materialViews)[number]["id"];
export const materialsModuleLabel = "Released Materials & Substitutions";
export const materialsHref = (packageId: string, view: MaterialViewId = "register") => {
  const segment = materialViews.find((v) => v.id === view)!.segment;
  return `/engineering/${packageId}/materials${segment ? `/${segment}` : ""}`;
};
// The header names the module and the current destination, so the view stays identifiable while
// the secondary menu is hidden. Only package-scoped material routes answer; /engineering does not.
export function materialViewForPath(path: string) {
  const match = /^\/engineering\/(?:[^/]+\/)?materials(?:\/([a-z]+))?\/?$/.exec(path);
  if (!match) return undefined;
  return materialViews.find((v) => v.segment === (match[1] ?? "")) ?? materialViews[0];
}

// ---------------------------------------------------------------------------------------------
// Exact quantities. Decimal strings with at most six fractional places are a fixture convention
// of this prototype, not a claim about any ERP. Arithmetic is on integers of millionths; a float
// never touches a quantity.
export const quantityScale = 6;
const unitScale = 10n ** BigInt(quantityScale);
export const units = ["EA", "PACK", "M", "L", "KG"] as const;
export type Unit = (typeof units)[number];
// Counted items, supplier packs, length, volume and mass are different dimensions. They are
// never interchangeable without explicit conversion evidence.
export const unitDimension: Record<Unit, "Count" | "Pack" | "Length" | "Volume" | "Mass"> = {
  EA: "Count",
  PACK: "Pack",
  M: "Length",
  L: "Volume",
  KG: "Mass",
};
export function parseQuantity(value: string): bigint | null {
  const match = /^(\d{1,12})(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) return null;
  return BigInt(match[1]) * unitScale + BigInt((match[2] ?? "").padEnd(quantityScale, "0"));
}
export function formatQuantity(value: bigint): string {
  const whole = value / unitScale,
    fraction = (value % unitScale).toString().padStart(quantityScale, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}
export const quantityText = (value: string, unit: string) => {
  const parsed = parseQuantity(value);
  return `${parsed === null ? value : formatQuantity(parsed)} ${unit}`;
};

// design_per_target is a rational: how many design units make one target unit ("4 EA per PACK"
// is 4/1). Missing evidence is unresolved, never 1:1; identical units need no conversion.
export type Conversion = {
  design_unit: Unit;
  target_unit: Unit;
  numerator: string | null;
  denominator: string | null;
  whole_units_only: boolean;
  target_precision: number;
  evidence: string | null;
  overage_basis: string | null;
};
export type ConversionResult =
  | { ok: true; quantity: string; unit: Unit; overage: string | null; exact: boolean }
  | { ok: false; code: "ConversionMissing" | "PrecisionUnsupported" | "OverageDecisionNeeded" | "InvalidQuantity"; message: string };
export function convertQuantity(design: string, c: Conversion): ConversionResult {
  const quantity = parseQuantity(design);
  if (quantity === null || quantity <= 0n) return { ok: false, code: "InvalidQuantity", message: "Enter a design quantity above zero with up to six decimal places." };
  if (c.target_precision < 0 || c.target_precision > quantityScale || !Number.isInteger(c.target_precision))
    return { ok: false, code: "PrecisionUnsupported", message: "The target declares a precision this prototype cannot represent." };
  const step = 10n ** BigInt(quantityScale - (c.whole_units_only ? 0 : c.target_precision));
  let target: bigint, remainder: bigint, n = 1n, d = 1n;
  if (c.design_unit === c.target_unit) {
    [target, remainder] = [quantity, 0n];
  } else {
    n = c.numerator === null ? 0n : BigInt(/^\d{1,9}$/.test(c.numerator) ? c.numerator : "0");
    d = c.denominator === null ? 0n : BigInt(/^\d{1,9}$/.test(c.denominator) ? c.denominator : "0");
    if (n <= 0n || d <= 0n || !c.evidence?.trim())
      return {
        ok: false,
        code: "ConversionMissing",
        message: `No evidenced conversion from ${c.design_unit} (${unitDimension[c.design_unit].toLowerCase()}) to ${c.target_unit} (${unitDimension[c.target_unit].toLowerCase()}). A missing conversion is unresolved, not one to one.`,
      };
    [target, remainder] = [(quantity * d) / n, (quantity * d) % n];
  }
  const partial = target % step;
  if (remainder === 0n && partial === 0n) return { ok: true, quantity: formatQuantity(target), unit: c.target_unit, overage: null, exact: true };
  if (!c.whole_units_only)
    return { ok: false, code: "PrecisionUnsupported", message: `${c.target_unit} is held to ${c.target_precision} decimal places; this quantity cannot be represented without an approved rounding basis.` };
  // Whole packs only: rounding up buys more than the design needs, which is a decision, not arithmetic.
  if (!c.overage_basis?.trim())
    return { ok: false, code: "OverageDecisionNeeded", message: `${quantityText(design, c.design_unit)} does not fill whole ${c.target_unit} units. Record who accepts the overage and how receiving treats it.` };
  const rounded = target - partial + step;
  return { ok: true, quantity: formatQuantity(rounded), unit: c.target_unit, overage: formatQuantity((rounded * n) / d - quantity), exact: false };
}

// ---------------------------------------------------------------------------------------------
// State families. One badge never stands for the whole business process.
export const mappingConditions = ["Verified", "Proposed", "Ambiguous", "Missing", "Unavailable", "Restricted", "Changed", "NotRequired"] as const;
export type MappingCondition = (typeof mappingConditions)[number];
export const substitutionStates = ["Draft", "Submitted", "Returned", "Held", "Rejected", "Accepted"] as const;
export type SubstitutionState = (typeof substitutionStates)[number];
export const criterionResults = ["Meets", "DoesNotMeet", "EvidenceNeeded", "NotApplicable"] as const;
export type CriterionResult = (typeof criterionResults)[number];
export const commercialStates = ["NotAssessed", "DecisionNeeded", "Decided", "NoEffectConfirmed"] as const;
export type CommercialState = (typeof commercialStates)[number];
export const reviewStates = ["Draft", "Submitted", "Returned", "Held", "TechnicallyReviewed", "Cancelled"] as const;
export type ReviewState = (typeof reviewStates)[number];
export const issueStates = ["Prepared", "Authorised", "Issued"] as const;
export type IssueState = (typeof issueStates)[number];
export const currentUses = ["NotAssessed", "EvidenceNeeded", "EligibleForPurpose", "ReassessmentNeeded", "Withdrawn", "Superseded"] as const;
export type CurrentUse = (typeof currentUses)[number];
export const handoverStates = ["Prepared", "AwaitingReceiver", "Accepted", "Returned"] as const;
export type HandoverState = (typeof handoverStates)[number];
export const releasePurposes = ["TechnicalReleaseForProcurement", "InformationOnly"] as const;
export type ReleasePurpose = (typeof releasePurposes)[number];
export const sourcePurposes = ["Procurement", "DesignCoordination", "InformationOnly"] as const;
export type SourcePurpose = (typeof sourcePurposes)[number];
export const sourceUses = ["Current", "Superseded", "Withdrawn", "Unavailable", "Restricted"] as const;
export type SourceUse = (typeof sourceUses)[number];
export const demandBases = ["Forecast", "Approved"] as const;
export const kitRoles = ["Independent", "KitParent", "KitChild"] as const;
export type KitRole = (typeof kitRoles)[number];
export const policyRoles = ["TechnicalReviewer", "ReleaseAuthority", "SupplyReceiver"] as const;
export type PolicyRole = (typeof policyRoles)[number];

export const labels: Record<string, string> = {
  TechnicalReleaseForProcurement: "Technical release for procurement",
  InformationOnly: "Information only",
  DesignCoordination: "Design coordination only",
  DoesNotMeet: "Does not meet",
  EvidenceNeeded: "Evidence needed",
  NotApplicable: "Not applicable",
  NotRequired: "Not required",
  NotAssessed: "Not assessed",
  DecisionNeeded: "Decision needed",
  NoEffectConfirmed: "No commercial effect confirmed",
  TechnicallyReviewed: "Technically reviewed",
  EligibleForPurpose: "Eligible for purpose",
  ReassessmentNeeded: "Reassessment needed",
  AwaitingReceiver: "Awaiting receiver",
  KitParent: "Kit (procured as one)",
  KitChild: "Kit content (informational)",
  TechnicalReviewer: "Technical reviewer",
  ReleaseAuthority: "Material release authority",
  SupplyReceiver: "Supply Chain coordinator",
};
export const label = (value: string) => labels[value] ?? value.replace(/([a-z])([A-Z])/g, "$1 $2");

// ---------------------------------------------------------------------------------------------
// Substitution comparison. No percentage score exists, because a score can hide a failed
// mandatory criterion. A mandatory criterion cannot be waived as "not applicable" in a notes
// field: a disputed requirement goes back upstream for a revised basis.
export type Criterion = { key: string; label: string; mandatory: boolean; result: CriterionResult; note: string | null; evidence: string | null };
export const comparisonDimensions = [
  ["function", "Intended function and performance"],
  ["physical", "Physical connections"],
  ["electrical", "Electrical interface"],
  ["firmware", "Firmware compatibility"],
  ["environment", "Horticultural environment"],
  ["support", "Reliability and support"],
  ["commissioning", "Commissioning requirements"],
  ["delivery", "Commercial and delivery effects"],
  ["installed", "Installed or purchased status"],
] as const;
export function acceptanceBlockers(criteria: Criterion[]): string[] {
  const blockers: string[] = [];
  if (!criteria.some((c) => c.mandatory)) blockers.push("No criterion is classed mandatory, so there is nothing a positive decision could rest on.");
  for (const c of criteria) {
    if (c.result === "NotApplicable" && !c.note?.trim()) blockers.push(`${c.label}: not applicable needs a reason.`);
    if (!c.mandatory) continue;
    if (c.result === "DoesNotMeet") blockers.push(`${c.label}: the candidate does not meet this mandatory criterion.`);
    else if (c.result === "EvidenceNeeded") blockers.push(`${c.label}: mandatory evidence is outstanding.`);
    else if (c.result === "NotApplicable") blockers.push(`${c.label}: a mandatory criterion cannot be set aside here; return the requirement upstream for a revised basis.`);
    else if (!c.evidence?.trim()) blockers.push(`${c.label}: name the exact evidence behind “Meets”.`);
  }
  return blockers;
}

// ---------------------------------------------------------------------------------------------
// Line readiness: the single register indicator for mixed blockers. The separate state families
// stay visible in the inspector. Five lines ready for review are not five lines eligible for issue.
export type ReadinessCode =
  | "SourceUnavailable" | "ReassessmentNeeded" | "EvidenceNeeded" | "MappingNeeded" | "ScopeDecision"
  | "Incomplete" | "MappingToVerify" | "Released" | "TechnicallyReviewed" | "ReadyForReview";
export type LineFacts = {
  complete: boolean;
  source_use: SourceUse | "Missing";
  mapping: MappingCondition;
  substitution: { state: SubstitutionState; evidence_outstanding: boolean; commercial: CommercialState } | null;
  scope_decision_needed: boolean;
  reviewed: boolean;
  released: boolean;
};
export type Readiness = { code: ReadinessCode; label: string; attention: boolean; tone: "neutral" | "attention" | "positive"; reasons: string[] };
const readinessLabels: Record<ReadinessCode, string> = {
  SourceUnavailable: "Source unavailable",
  ReassessmentNeeded: "Reassessment needed",
  EvidenceNeeded: "Evidence needed",
  MappingNeeded: "Mapping needed",
  ScopeDecision: "Scope decision",
  Incomplete: "Details needed",
  MappingToVerify: "Mapping to verify",
  Released: "Released",
  TechnicallyReviewed: "Technically reviewed",
  ReadyForReview: "Ready for review",
};
export function lineReadiness(f: LineFacts): Readiness {
  const reasons: [ReadinessCode, string][] = [];
  if (f.source_use === "Unavailable" || f.source_use === "Restricted" || f.source_use === "Missing")
    reasons.push(["SourceUnavailable", f.source_use === "Missing" ? "No exact drawing source is linked." : "A required source cannot be read in full; no positive decision can rest on it."]);
  if (f.source_use === "Superseded" || f.source_use === "Withdrawn")
    reasons.push(["ReassessmentNeeded", `The linked source is ${f.source_use.toLowerCase()}; earlier review cannot authorise new use.`]);
  if (f.substitution && ["Draft", "Submitted", "Returned", "Held"].includes(f.substitution.state) && f.substitution.evidence_outstanding)
    reasons.push(["EvidenceNeeded", "A proposed alternate is missing mandatory evidence."]);
  if (["Missing", "Ambiguous", "Changed", "Unavailable", "Restricted"].includes(f.mapping))
    reasons.push(["MappingNeeded", f.mapping === "Missing" ? "No item mapping exists for the target company." : `The item mapping is ${f.mapping.toLowerCase()} and needs its owner.`]);
  if (f.scope_decision_needed || f.substitution?.commercial === "DecisionNeeded")
    reasons.push(["ScopeDecision", "A scope or commercial decision is outstanding with its owner."]);
  if (!f.complete) reasons.push(["Incomplete", "Required line details are missing."]);
  if (f.mapping === "Proposed") reasons.push(["MappingToVerify", "The proposed item mapping has not been verified for the target."]);
  const code: ReadinessCode = reasons[0]?.[0] ?? (f.released ? "Released" : f.reviewed ? "TechnicallyReviewed" : "ReadyForReview");
  const attention = reasons.length > 0;
  return {
    code,
    label: readinessLabels[code],
    attention,
    tone: attention ? "attention" : code === "ReadyForReview" ? "neutral" : "positive",
    reasons: reasons.map(([, text]) => text),
  };
}

// ---------------------------------------------------------------------------------------------
// Release scope. Pure so that the screen preview, the server refusal and the tests agree.
export type ScopeLine = {
  id: string;
  line_number: string;
  description: string;
  quantity: string;
  unit: Unit;
  kit_role: KitRole;
  parent_line_id: string | null;
  dependency_group: string | null;
  released_quantity: string; // active technical-release entitlement already issued
  readiness: Readiness;
  purpose_supported: boolean;
  mapping_ready: boolean;
  conversion: ConversionResult | null;
  substitution_open: boolean;
  content_revision: number;
};
export type Selection = { line_id: string; quantity: string };
export type Blocker = { line_id: string | null; code: string; message: string };
export function releaseBlockers(lines: ScopeLine[], selection: Selection[], purpose: ReleasePurpose): Blocker[] {
  const blockers: Blocker[] = [],
    byId = new Map(lines.map((l) => [l.id, l])),
    chosen = new Map<string, bigint>();
  if (!selection.length) blockers.push({ line_id: null, code: "EmptyScope", message: "Select at least one material line." });
  for (const s of selection) {
    const line = byId.get(s.line_id),
      quantity = parseQuantity(s.quantity);
    if (!line) {
      blockers.push({ line_id: s.line_id, code: "UnknownLine", message: "A selected line is not part of this material set." });
      continue;
    }
    const name = `Line ${line.line_number}`;
    if (chosen.has(line.id)) blockers.push({ line_id: line.id, code: "DuplicateLine", message: `${name} is selected twice.` });
    if (quantity === null || quantity <= 0n) {
      blockers.push({ line_id: line.id, code: "InvalidQuantity", message: `${name}: enter a release quantity above zero.` });
      continue;
    }
    chosen.set(line.id, quantity);
    // Technical-release accounting, not an inventory ledger: active entitlements never exceed the requirement.
    const remaining = parseQuantity(line.quantity)! - parseQuantity(line.released_quantity)!;
    if (quantity > remaining)
      blockers.push({ line_id: line.id, code: "OverAllocation", message: `${name}: ${quantityText(formatQuantity(remaining < 0n ? 0n : remaining), line.unit)} remains unreleased; ${quantityText(s.quantity, line.unit)} would release the same scope twice.` });
    if (line.kit_role === "KitChild")
      blockers.push({ line_id: line.id, code: "KitContent", message: `${name} is content of a kit procured as one item. Release the kit line; its contents are informational and are never counted as separate demand.` });
    if (line.readiness.attention)
      blockers.push({ line_id: line.id, code: line.readiness.code, message: `${name}: ${line.readiness.reasons[0] ?? line.readiness.label}` });
    if (line.substitution_open)
      blockers.push({ line_id: line.id, code: "SubstitutionOpen", message: `${name}: a proposed alternate is undecided. Decide it, or withdraw it, before this line is released.` });
    if (purpose === "TechnicalReleaseForProcurement") {
      if (!line.purpose_supported)
        blockers.push({ line_id: line.id, code: "PurposeUnsupported", message: `${name}: the linked source issue does not permit procurement. A purpose cannot be relabelled here; the source owner issues it.` });
      if (!line.mapping_ready)
        blockers.push({ line_id: line.id, code: "MappingNotVerified", message: `${name}: a procurement release needs a verified item mapping for the target company.` });
      if (line.conversion && !line.conversion.ok)
        blockers.push({ line_id: line.id, code: line.conversion.code, message: `${name}: ${line.conversion.message}` });
    }
  }
  // A functionally dependent group is released whole or not at all. Partial release is for a
  // genuinely independent scope, never a way to make a package look ready.
  const groups = new Map<string, ScopeLine[]>();
  for (const l of lines) if (l.dependency_group) groups.set(l.dependency_group, [...(groups.get(l.dependency_group) ?? []), l]);
  for (const [group, members] of groups) {
    const inside = members.filter((m) => chosen.has(m.id));
    if (!inside.length || inside.length === members.length) continue;
    const missing = members.filter((m) => !chosen.has(m.id)).map((m) => m.line_number).join(", ");
    blockers.push({ line_id: inside[0].id, code: "DependencySplit", message: `Dependency group “${group}” works only as a whole. Include line ${missing} or leave the group out.` });
  }
  return blockers;
}
// Totals never add unlike units, and never count a kit and its contents as separate demand.
export function demandTotals(lines: Pick<ScopeLine, "quantity" | "unit" | "kit_role">[]) {
  const totals = new Map<string, bigint>();
  for (const l of lines) if (l.kit_role !== "KitChild") totals.set(l.unit, (totals.get(l.unit) ?? 0n) + (parseQuantity(l.quantity) ?? 0n));
  return [...totals].map(([unit, value]) => ({ unit, quantity: formatQuantity(value) }));
}

// ---------------------------------------------------------------------------------------------
// The frozen manifest of a release, and the present usability of what it froze. A historical issue
// stays issued for ever; whether it may still be relied on today is a separate, derived answer.
export type ManifestSource = { id: string; kind: string; reference: string; title: string; revision: string; file_version: string; content_hash: string | null; permitted_purpose: SourcePurpose; observed_at: string };
export type ManifestLine = {
  line_id: string; line_number: string; description: string; specification: string; discipline: string; system_name: string; location: string;
  served_areas: string[]; content_revision: number; content_hash: string; quantity: string; unit: Unit; requirement_quantity: string;
  manufacturer: string | null; model: string | null; supplier_part: string | null; product_ref: string | null; kit_role: KitRole;
  dependency_group: string | null; required_by: string | null; author_id: string;
  mapping: { condition: MappingCondition; provider: string | null; configuration: string | null; entity: string | null; item_key: string | null; item_description: string | null; version: number };
  procurement: { quantity: string; unit: Unit; overage: string | null; evidence: string | null } | null;
  substitution: { id: string; candidate_code: string; submitted_hash: string; decided_by: string; adopted_content_revision: number } | null;
  source_ids: string[];
};
export type ManifestExclusion = { line_id: string; line_number: string; description: string; remaining_quantity: string; unit: Unit; reason: string; owner: string };
export type Manifest = {
  schema_version: 1; package: { id: string; reference: string; title: string; context_kind: string; context_reference: string; company_id: string; site_id: string | null };
  set: { id: string; code: string; revision: number }; purpose: ReleasePurpose; audience: string;
  lines: ManifestLine[]; exclusions: ManifestExclusion[]; sources: ManifestSource[];
};
export function currentUse(
  release: { issue_state: IssueState; withdrawn: boolean; superseded: boolean },
  manifest: Pick<Manifest, "lines" | "sources">,
  lineHashes: ReadonlyMap<string, string>,
  sourceUses: ReadonlyMap<string, SourceUse>,
): { use: CurrentUse; reasons: string[] } {
  if (release.withdrawn) return { use: "Withdrawn", reasons: ["Current use was withdrawn. The original issue and anything that relied on it are retained."] };
  if (release.superseded) return { use: "Superseded", reasons: ["A successor release replaces this entitlement. It stays visible and is no longer counted."] };
  if (release.issue_state !== "Issued") return { use: "NotAssessed", reasons: [] };
  const stale: string[] = [], unread: string[] = [];
  for (const s of manifest.sources) {
    const use = sourceUses.get(s.id);
    if (use === "Superseded" || use === "Withdrawn") stale.push(`${s.reference} revision ${s.revision} is ${use.toLowerCase()}.`);
    else if (use !== "Current") unread.push(`${s.reference} revision ${s.revision} cannot be read in full.`);
  }
  for (const l of manifest.lines) if (lineHashes.get(l.line_id) !== l.content_hash) stale.push(`Line ${l.line_number} changed after this release froze it.`);
  if (stale.length) return { use: "ReassessmentNeeded", reasons: stale };
  return unread.length ? { use: "EvidenceNeeded", reasons: unread } : { use: "EligibleForPurpose", reasons: [] };
}
// A readable difference between a returned payload and its corrected successor.
export function manifestDifferences(before: ManifestLine[], after: ManifestLine[]): string[] {
  const out: string[] = [], old = new Map(before.map((l) => [l.line_id, l]));
  for (const l of after) {
    const was = old.get(l.line_id);
    if (!was) { out.push(`Line ${l.line_number} added: ${quantityText(l.quantity, l.unit)}.`); continue; }
    old.delete(l.line_id);
    if (was.quantity !== l.quantity || was.unit !== l.unit) out.push(`Line ${l.line_number}: quantity ${quantityText(was.quantity, was.unit)} became ${quantityText(l.quantity, l.unit)}.`);
    if (was.mapping.item_key !== l.mapping.item_key || was.mapping.condition !== l.mapping.condition) out.push(`Line ${l.line_number}: item mapping ${was.mapping.item_key ?? "none"} (${label(was.mapping.condition)}) became ${l.mapping.item_key ?? "none"} (${label(l.mapping.condition)}).`);
    if (JSON.stringify(was.procurement) !== JSON.stringify(l.procurement)) out.push(`Line ${l.line_number}: procurement quantity ${was.procurement ? quantityText(was.procurement.quantity, was.procurement.unit) : "unresolved"} became ${l.procurement ? quantityText(l.procurement.quantity, l.procurement.unit) : "unresolved"}.`);
    if (was.required_by !== l.required_by) out.push(`Line ${l.line_number}: required-by ${was.required_by ?? "date needed"} became ${l.required_by ?? "date needed"}.`);
    if (was.content_hash !== l.content_hash && out.at(-1)?.startsWith(`Line ${l.line_number}`) !== true) out.push(`Line ${l.line_number}: technical content moved from revision ${was.content_revision} to ${l.content_revision}.`);
  }
  for (const l of old.values()) out.push(`Line ${l.line_number} removed.`);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Authority. A role label grants nothing: the versioned synthetic policy names actors, and an
// absent policy never falls back to permissive behaviour.
export type PolicyGrant = { actor_id: string; role: PolicyRole; disciplines: string[]; purposes: ReleasePurpose[] };
export type Policy = { id: string; policy_version: number; allow_reviewer_release_overlap: boolean; grants: PolicyGrant[] } | null;
export function policyAllows(policy: Policy, actor: string, role: PolicyRole, disciplines: string[], purpose: ReleasePurpose): string | null {
  if (!policy) return "Authority not configured: no review and release policy covers this company and site.";
  const grant = policy.grants.find((g) => g.actor_id === actor && g.role === role);
  if (!grant) return `The configured policy (version ${policy.policy_version}) does not name you as ${label(role).toLowerCase()}.`;
  if (!grant.purposes.includes(purpose)) return `Your ${label(role).toLowerCase()} authority does not cover “${label(purpose)}”.`;
  const outside = disciplines.filter((d) => !grant.disciplines.includes(d));
  return outside.length ? `Your ${label(role).toLowerCase()} authority does not cover ${outside.join(", ")}.` : null;
}

// ---------------------------------------------------------------------------------------------
// Exports. A cell that a spreadsheet would run as a formula is neutralised; every field is quoted.
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}
export const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";

// Shared shapes between the server reads and the screens.
export type SourceRef = {
  id: string; kind: string; reference: string; title: string; revision: string; file_version: string;
  content_hash: string; permitted_purpose: SourcePurpose; observed_at: string; use: SourceUse;
  adapter: string; successor_id: string | null; restricted: boolean;
};
export type MaterialLine = {
  id: string; version: number; content_revision: number; content_hash: string; line_number: string;
  description: string; category: string; specification: string; discipline: string; system_name: string;
  location: string; served_areas: string[]; quantity: string; unit: Unit; quantity_basis: string;
  required_by: string | null; purpose: ReleasePurpose; manufacturer: string | null; model: string | null;
  supplier_part: string | null; product_ref: string | null; kit_role: KitRole; parent_line_id: string | null;
  dependency_group: string | null; scope_decision_needed: boolean; scope_decision_owner: string | null;
  author_id: string; author_name: string; next_owner_id: string; next_owner_name: string;
  next_action: string; action_due: string | null; drawing: SourceRef | null; basis: SourceRef | null;
  mapping: MappingCondition; mapping_item: string | null; released_quantity: string; removed: boolean;
  readiness: Readiness; substitution: { id: string; state: SubstitutionState; candidate_code: string } | null;
  updated_at: string;
};
