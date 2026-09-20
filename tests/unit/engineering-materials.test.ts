import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  acceptanceBlockers, convertQuantity, csv, csvCell, currentUse, demandTotals, formatQuantity, lineReadiness, manifestDifferences, parseQuantity,
  policyAllows, releaseBlockers, type Conversion, type Criterion, type LineFacts, type ManifestLine, type Policy, type ScopeLine,
} from "../../src/engineering/materials/model";
import { parseHandoverCommand, parseLineCommand, parseReleaseCommand, parseSourceCommand, parseSubstitutionCommand } from "../../src/engineering/materials/validation";
import { materialViews, materialsHref, materialsPath, pageForPath } from "../../src/shell/navigation";
import { AppError } from "../../src/platform/errors";

// EN-06 pure rules (build plan r02). Task-local labels EN06-Axx; none of these is a parent acceptance pass.
const base = () => ({ schema_version: 1, operation_id: randomUUID(), reason: "SYN rule check" });
const invalid = (field?: string) => (e: unknown) => e instanceof AppError && e.status === 422 && (!field || e.field_errors.some((f) => f.field === field));

test("quantities are exact decimal strings on integer arithmetic, never floats", () => {
  assert.equal(parseQuantity("0.1")! + parseQuantity("0.2")!, parseQuantity("0.3"));
  assert.equal(formatQuantity(parseQuantity("120.500000")!), "120.5");
  assert.equal(formatQuantity(parseQuantity("1.000000")!), "1");
  for (const bad of ["", "1.", ".5", "-1", "1e3", "1,5", "1.0000001", "1234567890123"]) assert.equal(parseQuantity(bad), null, bad);
});

test("EN06-A07: an evidenced exact conversion succeeds; missing, imprecise and part-pack cases block", () => {
  const packs: Conversion = { design_unit: "EA", target_unit: "PACK", numerator: "4", denominator: "1", whole_units_only: true, target_precision: 0, evidence: "SYN data sheet: 4 EA per pack", overage_basis: null };
  assert.deepEqual(convertQuantity("12", packs), { ok: true, quantity: "3", unit: "PACK", overage: null, exact: true });
  // Five each is not silently two packs: the overage is a decision, and only then arithmetic.
  const five = convertQuantity("5", packs);
  assert.equal(five.ok, false);
  assert.equal(!five.ok && five.code, "OverageDecisionNeeded");
  assert.deepEqual(convertQuantity("5", { ...packs, overage_basis: "SYN project accepts 3 EA as spares; receiving books them to the job." }), { ok: true, quantity: "2", unit: "PACK", overage: "3", exact: false });
  // A missing factor, or a factor with no evidence, is unresolved. It is never one to one.
  for (const c of [{ ...packs, numerator: null, denominator: null }, { ...packs, evidence: null }, { ...packs, evidence: "  " }]) {
    const r = convertQuantity("12", c);
    assert.equal(!r.ok && r.code, "ConversionMissing");
  }
  // The same unit needs no conversion and no evidence.
  assert.deepEqual(convertQuantity("120", { ...packs, design_unit: "M", target_unit: "M", numerator: null, denominator: null, evidence: null, whole_units_only: false, target_precision: 2 }), { ok: true, quantity: "120", unit: "M", overage: null, exact: true });
  // A target held to two decimals cannot carry a third without an approved rounding basis.
  const fine = convertQuantity("1.005", { ...packs, design_unit: "M", target_unit: "M", whole_units_only: false, target_precision: 2 });
  assert.equal(!fine.ok && fine.code, "PrecisionUnsupported");
  const thirds = convertQuantity("10", { ...packs, design_unit: "M", target_unit: "PACK", numerator: "3", whole_units_only: false, target_precision: 6 });
  assert.equal(!thirds.ok && thirds.code, "PrecisionUnsupported");
});

test("EN06-A09: a failed, unknown or set-aside mandatory criterion blocks acceptance, and there is no score to hide it", () => {
  const meets = (key: string, mandatory = true): Criterion => ({ key, label: key, mandatory, result: "Meets", note: null, evidence: "SYN evidence" });
  assert.deepEqual(acceptanceBlockers([meets("function"), meets("physical")]), []);
  assert.match(acceptanceBlockers([meets("function"), { ...meets("firmware"), result: "EvidenceNeeded", evidence: null }])[0], /mandatory evidence is outstanding/);
  assert.match(acceptanceBlockers([meets("function"), { ...meets("electrical"), result: "DoesNotMeet" }])[0], /does not meet/);
  // Nine passes do not outweigh one mandatory failure.
  assert.equal(acceptanceBlockers([...Array.from({ length: 9 }, (_, i) => meets(`c${i}`)), { ...meets("fit"), result: "DoesNotMeet" }]).length, 1);
  assert.match(acceptanceBlockers([meets("function"), { ...meets("firmware"), result: "NotApplicable", note: "SYN not relevant" }])[0], /cannot be set aside/);
  assert.match(acceptanceBlockers([{ ...meets("function"), evidence: null }])[0], /exact evidence/);
  assert.match(acceptanceBlockers([meets("support", false)])[0], /nothing a positive decision could rest on/);
  // An optional criterion may wait; "not applicable" always needs its reason.
  assert.deepEqual(acceptanceBlockers([meets("function"), { ...meets("commissioning", false), result: "EvidenceNeeded", evidence: null }]), []);
  assert.match(acceptanceBlockers([meets("function"), { ...meets("delivery", false), result: "NotApplicable" }])[0], /needs a reason/);
});

const facts = (over: Partial<LineFacts> = {}): LineFacts => ({ complete: true, source_use: "Current", mapping: "Verified", substitution: null, scope_decision_needed: false, reviewed: false, released: false, ...over });
test("EN06-A38 A39: line readiness is one indicator over separate families; a current source implies no acceptance", () => {
  assert.deepEqual([lineReadiness(facts()).code, lineReadiness(facts()).tone, lineReadiness(facts()).attention], ["ReadyForReview", "neutral", false]);
  assert.equal(lineReadiness(facts({ mapping: "Missing" })).label, "Mapping needed");
  assert.equal(lineReadiness(facts({ substitution: { state: "Submitted", evidence_outstanding: true, commercial: "NotAssessed" } })).label, "Evidence needed");
  assert.equal(lineReadiness(facts({ mapping: "Proposed", substitution: { state: "Submitted", evidence_outstanding: false, commercial: "DecisionNeeded" } })).label, "Scope decision");
  assert.equal(lineReadiness(facts({ mapping: "Proposed" })).code, "MappingToVerify");
  assert.equal(lineReadiness(facts({ source_use: "Superseded", reviewed: true })).code, "ReassessmentNeeded");
  assert.equal(lineReadiness(facts({ source_use: "Unavailable" })).code, "SourceUnavailable");
  assert.equal(lineReadiness(facts({ source_use: "Missing" })).attention, true);
  assert.deepEqual([lineReadiness(facts({ reviewed: true })).code, lineReadiness(facts({ reviewed: true, released: true })).code], ["TechnicallyReviewed", "Released"]);
  // Every blocker is kept as a reason, in one stable order, so the inspector can show them all.
  assert.equal(lineReadiness(facts({ mapping: "Ambiguous", scope_decision_needed: true, complete: false })).reasons.length, 3);
});

const ready = lineReadiness(facts());
const scope = (n: string, over: Partial<ScopeLine> = {}): ScopeLine => ({ id: n, line_number: n, description: `SYN line ${n}`, quantity: "6", unit: "EA", kit_role: "Independent", parent_line_id: null, dependency_group: null, released_quantity: "0", readiness: ready, purpose_supported: true, mapping_ready: true, conversion: { ok: true, quantity: "6", unit: "EA", overage: null, exact: true }, substitution_open: false, content_revision: 1, ...over });
const codes = (lines: ScopeLine[], picked: { line_id: string; quantity: string }[], purpose: "TechnicalReleaseForProcurement" | "InformationOnly" = "TechnicalReleaseForProcurement") => releaseBlockers(lines, picked, purpose).map((b) => b.code);
test("EN06-A08 A16: a partial release is an independent scope; groups, kits and entitlements are conserved", () => {
  const lines = [scope("010", { dependency_group: "Pump and control pair" }), scope("020"), scope("030", { dependency_group: "Pump and control pair" })];
  assert.deepEqual(codes(lines, [{ line_id: "020", quantity: "4" }]), []);
  assert.deepEqual(codes(lines, [{ line_id: "010", quantity: "6" }]), ["DependencySplit"]);
  assert.deepEqual(codes(lines, [{ line_id: "010", quantity: "6" }, { line_id: "030", quantity: "6" }]), []);
  // Four of six are out; two remain. Three more would entitle the same scope twice.
  const part = [scope("020", { released_quantity: "4" })];
  assert.deepEqual(codes(part, [{ line_id: "020", quantity: "2" }]), []);
  assert.deepEqual(codes(part, [{ line_id: "020", quantity: "3" }]), ["OverAllocation"]);
  assert.deepEqual(codes([], []), ["EmptyScope"]);
  assert.deepEqual(codes(lines, [{ line_id: "999", quantity: "1" }]), ["UnknownLine"]);
  assert.deepEqual(codes(lines, [{ line_id: "020", quantity: "1" }, { line_id: "020", quantity: "1" }]), ["DuplicateLine"]);
  assert.deepEqual(codes(lines, [{ line_id: "020", quantity: "0" }]), ["InvalidQuantity"]);
  // Kit contents are informational: they are never released, and never totalled, as separate demand.
  const kit = [scope("060", { kit_role: "KitParent", quantity: "3", unit: "PACK" }), scope("061", { kit_role: "KitChild", parent_line_id: "060", quantity: "12" })];
  assert.deepEqual(codes(kit, [{ line_id: "061", quantity: "12" }]), ["KitContent"]);
  assert.deepEqual(demandTotals([...kit, scope("050", { quantity: "120", unit: "M" }), scope("070", { quantity: "1.5" })]), [{ unit: "PACK", quantity: "3" }, { unit: "M", quantity: "120" }, { unit: "EA", quantity: "1.5" }]);
});

test("EN06-A02 A06 A14: procurement needs a permitting source, a verified binding and a resolved quantity; ready for review is not eligible for issue", () => {
  assert.deepEqual(codes([scope("010", { purpose_supported: false })], [{ line_id: "010", quantity: "6" }]), ["PurposeUnsupported"]);
  assert.deepEqual(codes([scope("010", { mapping_ready: false })], [{ line_id: "010", quantity: "6" }]), ["MappingNotVerified"]);
  assert.deepEqual(codes([scope("010", { conversion: { ok: false, code: "ConversionMissing", message: "SYN" } })], [{ line_id: "010", quantity: "6" }]), ["ConversionMissing"]);
  assert.deepEqual(codes([scope("010", { substitution_open: true })], [{ line_id: "010", quantity: "6" }]), ["SubstitutionOpen"]);
  assert.deepEqual(codes([scope("010", { readiness: lineReadiness(facts({ source_use: "Superseded" })) })], [{ line_id: "010", quantity: "6" }]), ["ReassessmentNeeded"]);
  // An information-only output is a different, visibly weaker purpose: it needs none of the procurement evidence.
  assert.deepEqual(codes([scope("010", { purpose_supported: false, mapping_ready: false, conversion: null })], [{ line_id: "010", quantity: "6" }], "InformationOnly"), []);
});

const policy: Policy = { id: randomUUID(), policy_version: 1, allow_reviewer_release_overlap: false, grants: [{ actor_id: "casey", role: "TechnicalReviewer", disciplines: ["Hydraulics", "Controls"], purposes: ["TechnicalReleaseForProcurement"] }] };
test("EN06-A10: an absent policy grants nothing, and a role label grants nothing", () => {
  assert.match(policyAllows(null, "casey", "TechnicalReviewer", ["Hydraulics"], "TechnicalReleaseForProcurement")!, /^Authority not configured/);
  assert.equal(policyAllows(policy, "casey", "TechnicalReviewer", ["Hydraulics", "Controls"], "TechnicalReleaseForProcurement"), null);
  assert.match(policyAllows(policy, "casey", "ReleaseAuthority", ["Hydraulics"], "TechnicalReleaseForProcurement")!, /does not name you/);
  assert.match(policyAllows(policy, "alex", "TechnicalReviewer", ["Hydraulics"], "TechnicalReleaseForProcurement")!, /does not name you/);
  assert.match(policyAllows(policy, "casey", "TechnicalReviewer", ["Electrical"], "TechnicalReleaseForProcurement")!, /does not cover Electrical/);
  assert.match(policyAllows(policy, "casey", "TechnicalReviewer", ["Hydraulics"], "InformationOnly")!, /does not cover/);
});

const manifestLine = (n: string, over: Partial<ManifestLine> = {}): ManifestLine => ({ line_id: n, line_number: n, description: "SYN", specification: "SYN", discipline: "Hydraulics", system_name: "SYN", location: "SYN", served_areas: [], content_revision: 1, content_hash: "a".repeat(64), quantity: "4", unit: "EA", requirement_quantity: "6", manufacturer: null, model: null, supplier_part: null, product_ref: null, kit_role: "Independent", dependency_group: null, required_by: null, author_id: "alex", mapping: { condition: "Verified", provider: "Synthetic", configuration: "SYN", entity: "SYN-A", item_key: "SYN-1", item_description: null, version: 1 }, procurement: { quantity: "4", unit: "EA", overage: null, evidence: null }, substitution: null, source_ids: ["h102"], ...over });
test("EN06-A14 A19 A23: a historical issue stays issued; whether it may still be relied on is a separate answer", () => {
  const source = { id: "h102", kind: "DrawingIssue", reference: "H-102", title: "SYN", revision: "B", file_version: "1.0", content_hash: "b".repeat(64), permitted_purpose: "Procurement" as const, observed_at: "2026-09-20T00:00:00.000Z" };
  const manifest = { lines: [manifestLine("020")], sources: [source] }, issued = { issue_state: "Issued" as const, withdrawn: false, superseded: false };
  const hashes = new Map([["020", "a".repeat(64)]]);
  assert.equal(currentUse(issued, manifest, hashes, new Map([["h102", "Current" as const]])).use, "EligibleForPurpose");
  const stale = currentUse(issued, manifest, hashes, new Map([["h102", "Superseded" as const]]));
  assert.deepEqual([stale.use, stale.reasons], ["ReassessmentNeeded", ["H-102 revision B is superseded."]]);
  assert.equal(currentUse(issued, manifest, new Map([["020", "c".repeat(64)]]), new Map([["h102", "Current" as const]])).use, "ReassessmentNeeded");
  assert.equal(currentUse(issued, manifest, hashes, new Map([["h102", "Unavailable" as const]])).use, "EvidenceNeeded");
  assert.equal(currentUse({ ...issued, withdrawn: true }, manifest, hashes, new Map()).use, "Withdrawn");
  assert.equal(currentUse({ ...issued, superseded: true }, manifest, hashes, new Map()).use, "Superseded");
  assert.equal(currentUse({ ...issued, issue_state: "Authorised" }, manifest, hashes, new Map()).use, "NotAssessed");
});

test("EN06-A21: a corrected payload is compared with the returned one in words", () => {
  const before = [manifestLine("020"), manifestLine("070")];
  const after = [manifestLine("020", { quantity: "6", procurement: { quantity: "6", unit: "EA", overage: null, evidence: null }, required_by: "2026-11-14" }), manifestLine("050", { unit: "M", quantity: "120" })];
  assert.deepEqual(manifestDifferences(before, after), [
    "Line 020: quantity 4 EA became 6 EA.", "Line 020: procurement quantity 4 EA became 6 EA.", "Line 020: required-by date needed became 2026-11-14.", "Line 050 added: 120 M.", "Line 070 removed.",
  ]);
  assert.deepEqual(manifestDifferences(before, before), []);
});

test("EN06-A28: a spreadsheet formula is neutralised, every field is quoted, and unlike units are never totalled", () => {
  for (const lead of ["=", "+", "-", "@", "\t", "\r"]) assert.equal(csvCell(`${lead}HYPERLINK("x")`), `"'${lead}HYPERLINK(""x"")"`);
  assert.equal(csvCell('Pump "duty", 50 mm'), '"Pump ""duty"", 50 mm"');
  assert.equal(csvCell(null), '""');
  assert.equal(csv([["Line", "Qty"], ["010", 1]]), '"Line","Qty"\r\n"010","1"\r\n');
});

const line = () => ({ ...base(), action: "save", line_id: randomUUID(), set_id: randomUUID(), line_number: "030", description: "SYN Control interface module", category: "Controls", specification: "SYN spec", discipline: "Controls", system_name: "Controls", location: "Irrigation Shed 01", served_areas: ["Greenhouse 01"], quantity: "1.50", unit: "EA", quantity_basis: "SYN counted", purpose: "TechnicalReleaseForProcurement", next_owner_id: randomUUID(), next_action: "SYN review" });
test("EN06-A27: commands list the keys they accept, so an approval, a hash or a purpose cannot ride along", () => {
  const parsed = parseLineCommand(line());
  assert.equal(parsed.action === "save" && parsed.quantity, "1.5");
  assert.equal(parsed.action === "save" && parsed.required_by, null);
  for (const smuggled of ["approved", "content_hash", "mapping", "author_id", "readiness", "released_quantity"]) assert.throws(() => parseLineCommand({ ...line(), [smuggled]: "Verified" }), invalid(smuggled));
  assert.throws(() => parseLineCommand({ ...line(), quantity: 1.5 }), invalid("quantity"));
  assert.throws(() => parseLineCommand({ ...line(), quantity: "0" }), invalid("quantity"));
  assert.throws(() => parseLineCommand({ ...line(), line_number: "30" }), invalid("line_number"));
  assert.throws(() => parseLineCommand({ ...line(), kit_role: "KitChild" }), invalid("parent_line_id"));
  assert.throws(() => parseLineCommand({ ...line(), scope_decision_needed: true }), invalid("scope_decision_owner_id"));
  // A binding cannot carry requirement fields, and half a conversion factor is refused.
  const binding = { ...base(), action: "binding", line_id: randomUUID(), expected_version: 2, mapping: "Proposed", mapping_item_key: "SYN-1" };
  assert.equal(parseLineCommand(binding).action, "binding");
  assert.throws(() => parseLineCommand({ ...binding, quantity: "9" }), invalid("quantity"));
  assert.throws(() => parseLineCommand({ ...binding, conversion_numerator: 4 }), invalid("conversion_denominator"));
  // A release carries a scope and nothing else: no reviewer, no authorisation, no hash.
  const prepare = { ...base(), action: "prepare", id: randomUUID(), set_id: randomUUID(), purpose: "TechnicalReleaseForProcurement", audience: "SYN Supply Chain", selection: [{ line_id: randomUUID(), quantity: "4" }] };
  assert.equal(parseReleaseCommand(prepare).action, "prepare");
  for (const smuggled of ["authorised_by", "content_hash", "review_state", "policy_version"]) assert.throws(() => parseReleaseCommand({ ...prepare, [smuggled]: "x" }), invalid(smuggled));
  assert.throws(() => parseReleaseCommand({ ...prepare, selection: [] }), invalid("selection"));
  assert.throws(() => parseReleaseCommand({ ...base(), action: "review", release_id: randomUUID(), expected_version: 2, result: "Returned", rationale: "SYN" }), invalid("owner_id"));
  // A source's purpose belongs to the adapter's publish command only; a withdrawal takes an id and a reason.
  assert.throws(() => parseSourceCommand({ ...base(), action: "withdraw", source_id: randomUUID(), permitted_purpose: "Procurement" }), invalid("permitted_purpose"));
  assert.throws(() => parseSourceCommand({ ...base(), action: "publish", id: randomUUID(), kind: "DrawingIssue", reference: "H-1", title: "SYN", revision: "C", file_version: "1", permitted_purpose: "Procurement", content: "SYN", content_hash: "a".repeat(64) }), invalid("content_hash"));
});

test("EN06-A13 A22: Engineering cannot declare a commercial non-issue, and forecast demand is never procurement-ready", () => {
  const propose = { ...base(), action: "propose", id: randomUUID(), line_id: randomUUID(), candidate_code: "CI-120", candidate_description: "SYN alternate", candidate_manufacturer: "SYN", candidate_revision: "r2", proposal_reason: "SYN", scope_quantity: "1", criteria: [{ key: "function", label: "Function", mandatory: true, result: "Meets", evidence: "SYN", note: null }] };
  assert.equal(parseSubstitutionCommand(propose).action, "propose");
  assert.throws(() => parseSubstitutionCommand({ ...propose, commercial_state: "NoEffectConfirmed" }), invalid("commercial_state"));
  assert.throws(() => parseSubstitutionCommand({ ...propose, criteria: [propose.criteria[0], propose.criteria[0]] }), invalid("criteria-1"));
  assert.throws(() => parseSubstitutionCommand({ ...base(), action: "decide", substitution_id: randomUUID(), expected_version: 2, result: "Held", rationale: "SYN" }), invalid("owner_id"));
  const handover = { ...base(), action: "prepare", id: randomUUID(), release_id: randomUUID(), requested_action: "ProcurementReady", demand_basis: "Approved", demand_source_id: randomUUID(), receiver_id: randomUUID() };
  assert.equal(parseHandoverCommand(handover).action, "prepare");
  assert.throws(() => parseHandoverCommand({ ...handover, demand_basis: "Forecast", demand_source_id: null }), invalid("demand_basis"));
  assert.throws(() => parseHandoverCommand({ ...handover, demand_source_id: null }), invalid("demand_source_id"));
  // A return says why, who corrects it and by when; an acceptance is of the whole payload and carries none of that.
  const decide = { ...base(), action: "decide", handover_id: randomUUID(), expected_version: 2 };
  assert.throws(() => parseHandoverCommand({ ...decide, result: "Returned" }), invalid("reasons"));
  assert.throws(() => parseHandoverCommand({ ...decide, result: "Accepted", reasons: [{ reason: "SYN partly" }] }), invalid("reasons"));
  assert.equal(parseHandoverCommand({ ...decide, result: "Accepted" }).action, "decide");
});

test("EN06-A36: six route destinations in menu order; the header resolves them and nothing else", () => {
  assert.deepEqual(materialViews.map((v) => v.label), ["Materials register", "Item & unit mapping", "Substitution review", "Review & release", "Supply handover", "Changes & history"]);
  const id = randomUUID();
  assert.equal(materialsHref(id), `/engineering/${id}/materials`);
  assert.equal(materialsHref(id, "handover"), `/engineering/${id}/materials/handover`);
  for (const v of materialViews) assert.equal(materialsPath(materialsHref(id, v.id))?.view?.id, v.id);
  assert.deepEqual(materialsPath("/engineering/materials"), { package_id: null, view: undefined });
  for (const other of ["/engineering", `/engineering/${id}`, `/engineering/${id}/materials/unknown`, "/work", `/projects/${id}/materials`]) assert.equal(materialsPath(other), undefined, other);
  assert.equal(pageForPath(materialsHref(id, "releases"))?.id, "engineering");
});
