// The EN-06 review scenario of mockup r04, built through the application's ordinary commands by the fictional
// people who would do each step. Nothing is written to the database directly, and no step borrows authority:
// the coordinator operates the synthetic upstream adapter, the authors author, and nobody reviews here.
// With fixed identities (the demonstration script) a rerun replays the same original operations and changes
// nothing; with fresh identities (the browser journeys) every run gets a package of its own.
import { createHash, randomUUID } from "node:crypto";
import { CRM } from "./crm";

export type Call = (path: string, body?: unknown) => Promise<{ status: number; body: unknown }>;
export type SignIn = (profile: string) => Promise<Call>;
export const MATERIALS = {
  coordinator: { profile: "coordinator", id: CRM.owner },
  author: { profile: "materials-author", id: "30000000-0000-4000-8000-000000000016", name: "SYN Alex Lee" },
  engineer: { profile: "materials-engineer", id: "30000000-0000-4000-8000-000000000017", name: "SYN Sam Jordan" },
  reviewer: { profile: "materials-reviewer", id: "30000000-0000-4000-8000-000000000018", name: "SYN Casey Reviewer" },
  release: { profile: "materials-release", id: "30000000-0000-4000-8000-000000000019", name: "SYN Drew Release authority" },
  supply: { profile: "materials-supply", id: "30000000-0000-4000-8000-000000000020", name: "SYN Robin Supply coordinator" },
  viewer: { profile: "materials-viewer", id: "30000000-0000-4000-8000-000000000021", name: "SYN Quinn Materials viewer" },
  entity: "SYN-A",
} as const;

// A stable identity per named record and per named step, so a rerun of the demonstration replays each original
// operation under its own ID whatever happened to the steps around it.
function stableId(key: string) {
  const h = createHash("sha256").update(`ppo-en06-scenario:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export function scenarioIds(fixed: boolean) {
  let n = 0;
  const next = () => (fixed ? stableId(`record:${++n}`) : randomUUID());
  const lines = ["010", "020", "030", "040", "050", "060", "070", "080"] as const;
  return {
    fixed, op: (step: string) => (fixed ? stableId(`operation:${step}`) : randomUUID()),
    organisation: next(), site: next(), project: next(), package: next(), set: next(), setB: next(),
    basis: next(), coordinationBasis: next(), demand: next(), coordinationDrawing: next(),
    drawings: Object.fromEntries(lines.map((l) => [l, next()])) as Record<(typeof lines)[number], string>,
    lines: Object.fromEntries(lines.map((l) => [l, next()])) as Record<(typeof lines)[number], string>,
    heldLine: next(), substitution030: next(), substitution080: next(),
  };
}
export type ScenarioIds = ReturnType<typeof scenarioIds>;

const base = (ids: ScenarioIds, step: string, reason: string) => ({ operation_id: ids.op(step), schema_version: 1, reason });
// An identical original replays (200); a record another run already made answers 409. Anything else is a real failure.
async function ensure(call: Call, path: string, body: unknown, what: string) {
  const r = await call(path, body);
  if (![200, 201, 409].includes(r.status)) throw Error(`${what} failed (${r.status}): ${JSON.stringify(r.body)}`);
  return r;
}

const drawings = [
  ["010", "H-101", "C", "Pump station hydraulic arrangement"], ["020", "H-102", "B", "Greenhouse 01 isolation schedule"],
  ["030", "E-201", "C", "Irrigation control interface wiring"], ["040", "H-103", "B", "Pressure monitoring points"],
  ["050", "H-104", "A", "Shared irrigation distribution"], ["060", "H-105", "A", "Greenhouse 01 connection details"],
  ["070", "M-101", "B", "Pump skid mounting"], ["080", "H-106", "B", "Filtration arrangement"],
] as const;
type LineSpec = { n: keyof ScenarioIds["lines"]; description: string; category: string; discipline: string; system: string; location: string; served: string[]; quantity: string; unit: string; basis: string; model: string; product: string; owner: "author" | "engineer"; action: string; due: string | null; required_by: string | null; group?: string; scope?: boolean };
const lineSpecs: LineSpec[] = [
  { n: "010", description: "Pump assembly", category: "Pumps", discipline: "Hydraulics", system: "Irrigation supply", location: "Irrigation Shed 01", served: ["Propagation house 01", "Greenhouse 01", "Nursery pad 02"], quantity: "1", unit: "EA", basis: "One duty pump shown on H-101; it serves three areas and is still one pump.", model: "Duty irrigation pump", product: "PA-300", owner: "author", action: "Submit for technical review", due: "2026-09-26", required_by: "2026-11-14", group: "Pump and control pair" },
  { n: "020", description: "Isolation valve set", category: "Valves", discipline: "Hydraulics", system: "Irrigation supply", location: "Greenhouse 01", served: ["Greenhouse 01"], quantity: "6", unit: "EA", basis: "Six isolation points counted on H-102.", model: "Isolation valve 50 mm", product: "IV-050", owner: "author", action: "Submit for technical review", due: "2026-09-26", required_by: "2026-11-14" },
  { n: "030", description: "Control interface module", category: "Controls", discipline: "Controls", system: "Controls", location: "Irrigation Shed 01", served: ["Propagation house 01", "Greenhouse 01", "Nursery pad 02"], quantity: "1", unit: "EA", basis: "One interface per pump controller on E-201.", model: "Standard control interface", product: "CI-100", owner: "engineer", action: "Obtain supplier firmware statement", due: "2026-09-22", required_by: null, group: "Pump and control pair" },
  { n: "040", description: "Pressure sensor", category: "Instrumentation", discipline: "Controls", system: "Irrigation supply", location: "Irrigation Shed 01", served: ["Greenhouse 01"], quantity: "2", unit: "EA", basis: "Two monitoring points on H-103.", model: "Pressure transmitter 0-10 bar", product: "PS-010", owner: "author", action: "Request an item mapping from the item owner", due: "2026-09-25", required_by: "2026-11-14" },
  { n: "050", description: "Irrigation tubing", category: "Pipe and tube", discipline: "Hydraulics", system: "Shared irrigation system", location: "Shared irrigation system", served: ["Greenhouse 01", "Nursery pad 02"], quantity: "120", unit: "M", basis: "Run lengths measured from H-104; no waste allowance has been added.", model: "Irrigation tube 25 mm", product: "IT-025", owner: "author", action: "Submit for technical review", due: "2026-09-26", required_by: "2026-11-21" },
  { n: "060", description: "Connection kit", category: "Fittings", discipline: "Hydraulics", system: "Irrigation supply", location: "Greenhouse 01", served: ["Greenhouse 01"], quantity: "3", unit: "PACK", basis: "One kit per bench manifold on H-105.", model: "Bench connection kit", product: "CK-003", owner: "author", action: "Submit for technical review", due: "2026-09-26", required_by: "2026-11-21" },
  { n: "070", description: "Mounting assembly", category: "Structural", discipline: "Mechanical", system: "Irrigation supply", location: "Irrigation Shed 01", served: ["Irrigation Shed 01"], quantity: "1", unit: "EA", basis: "One skid frame on M-101.", model: "Pump skid frame", product: "MA-101", owner: "author", action: "Submit for technical review", due: "2026-09-26", required_by: "2026-11-14" },
  { n: "080", description: "Filter assembly", category: "Filtration", discipline: "Hydraulics", system: "Shared irrigation", location: "Shared irrigation", served: ["Greenhouse 01", "Nursery pad 02"], quantity: "1", unit: "EA", basis: "One filter station on H-106.", model: "Disc filter 120 mesh", product: "FA-200", owner: "engineer", action: "Await the scope decision on the alternate filter", due: "2026-09-24", required_by: "2026-11-21" },
];
const criterion = (key: string, label: string, mandatory: boolean, result: string, evidence: string | null, note: string | null = null) => ({ key, label, mandatory, result, evidence, note });

// Customer, site, awarded Project and Engineering package: ordinary shared records, made by the coordinator.
export async function seedMaterialsContext(as: SignIn, ids: ScenarioIds, tag = "") {
  const coordinator = await as(MATERIALS.coordinator.profile), name = (text: string) => `SYN ${text}${tag}`;
  await ensure(coordinator, "customers", { ...base(ids, "customer", "SYN EN-06 review scenario"), id: ids.organisation, company_id: CRM.company, display_name: name("Willowbank Horticulture"), relationship_status: "Active", owner_id: CRM.owner, sector: "Nursery", access_class: "Internal" }, "Customer");
  await ensure(coordinator, "sites", { ...base(ids, "site", "SYN EN-06 review scenario"), id: ids.site, company_id: CRM.company, display_name: name("Nursery & propagation site"), location_description: "Fictional nursery and propagation site for the EN-06 review scenario.", timezone: "Australia/Brisbane", owner_id: CRM.owner, parties: [{ organisation_id: ids.organisation, role: "Operator", valid_from: "2026-01-01T00:00:00.000Z" }] }, "Site");
  await ensure(coordinator, "projects", { ...base(ids, "project", "SYN EN-06 review scenario"), id: ids.project, company_id: CRM.company, organisation_id: ids.organisation, site_id: ids.site, coordinator_id: CRM.owner, title: name("Nursery irrigation upgrade"), target_date: "2026-12-18" }, "Project");
  await ensure(coordinator, "engineering", { ...base(ids, "package", "SYN EN-06 review scenario"), id: ids.package, context_kind: "Project", context_id: ids.project, title: name("Nursery irrigation materials"), brief: "SYN Material requirements, substitutions and technical release for the nursery irrigation upgrade.", owner_id: MATERIALS.author.id, discipline: "Hydraulics", required_date: "2026-11-14", next_action: "Prepare the released materials set", action_due: "2026-09-26" }, "Engineering package");
  return coordinator;
}

export async function seedMaterialsScenario(as: SignIn, ids: ScenarioIds, tag = "") {
  const coordinator = await seedMaterialsContext(as, ids, tag), materials = `engineering/${ids.package}/materials`;
  // The synthetic upstream adapter. A separately authored procurement-capable basis is the positive fixture; the
  // coordination-only basis is retained beside it as the negative one, and nothing relabels either.
  const source = (id: string, kind: string, reference: string, revision: string, title: string, purpose: string) =>
    ensure(coordinator, `${materials}/sources`, { ...base(ids, `source:${reference}:${revision}`, "SYN source observed through the synthetic upstream adapter"), action: "publish", id, kind, reference, title, revision, file_version: "1.0", permitted_purpose: purpose, content: `SYNTHETIC ${kind} ${reference} revision ${revision}: ${title}. Authored for the EN-06 demonstration; it is not an issued Powerplants document.` }, `Source ${reference}`);
  await source(ids.basis, "DesignBasis", "EN-02 basis", "r02", "Nursery irrigation design basis (authored procurement fixture)", "Procurement");
  await source(ids.coordinationBasis, "DesignBasis", "EN-03/EN-05 coordination", "r01", "Drawing register coordination issue (design coordination only)", "DesignCoordination");
  await source(ids.coordinationDrawing, "DrawingIssue", "H-190", "A", "Propagation house reticulation (coordination issue)", "DesignCoordination");
  await source(ids.demand, "DemandAuthority", "SYN-DA-001", "r01", "Approved demand for the nursery irrigation upgrade (fictional authority)", "Procurement");
  for (const [n, reference, revision, title] of drawings) await source(ids.drawings[n], "DrawingIssue", reference, revision, title, "Procurement");

  const author = await as(MATERIALS.author.profile), engineer = await as(MATERIALS.engineer.profile);
  await ensure(author, materials, { ...base(ids, "set:A", "SYN material set carried forward at revision 3"), action: "create", id: ids.set, set_code: "A", revision: 3, title: "Irrigation upgrade released materials" }, "Material set A");
  const lineBody = (l: LineSpec, setId: string, lineId: string, drawing: string, basisId: string) => ({
    action: "save", line_id: lineId, set_id: setId, line_number: l.n, description: l.description, category: l.category, specification: `${l.model} as shown on the linked drawing issue. Fictional values for the EN-06 demonstration.`,
    discipline: l.discipline, system_name: l.system, location: l.location, served_areas: l.served, quantity: l.quantity, unit: l.unit, quantity_basis: l.basis, required_by: l.required_by,
    purpose: "TechnicalReleaseForProcurement", manufacturer: "SYN Fictional Supply", model: l.model, supplier_part: `SYN-${l.product}`, product_ref: l.product, kit_role: "Independent",
    dependency_group: l.group ?? null, drawing_source_id: drawing, basis_source_id: basisId, scope_decision_needed: false,
    next_owner_id: MATERIALS[l.owner].id, next_action: l.action, action_due: l.due,
  });
  for (const l of lineSpecs) await ensure(l.owner === "engineer" ? engineer : author, `${materials}/lines`, { ...base(ids, `line:A:${l.n}`, "SYN requirement taken from the linked drawing issue"), ...lineBody(l, ids.set, ids.lines[l.n], ids.drawings[l.n], ids.basis) }, `Line ${l.n}`);

  // Bindings: authors propose; the item owner, reached through the synthetic adapter, verifies for entity SYN-A.
  const versions = async (call: Call) => new Map(((await call(`${materials}?set=${ids.set}&page_size=100`)).body as { items: { id: string; version: number; mapping: string }[] }).items.map((i) => [i.id, i]));
  const binding = (l: LineSpec, mapping: string, expected_version: number) => ({
    action: "binding", line_id: ids.lines[l.n], expected_version, mapping, mapping_configuration: "SYN-ITEMS-2026", mapping_entity: MATERIALS.entity, mapping_item_key: `SYN-ITM-${l.product}`,
    mapping_item_description: l.model, target_unit: l.n === "050" ? "PACK" : l.unit,
    // 120 M of tube is bought as 30 M coils: an evidenced, exact conversion to four whole packs.
    ...(l.n === "050" ? { conversion_numerator: 30, conversion_denominator: 1, whole_units_only: true, target_precision: 0, conversion_evidence: "SYN supplier data sheet IT-025: 30 M per coil (PACK)." } : {}),
  });
  let current = await versions(author);
  for (const l of lineSpecs.filter((x) => x.n !== "040"))
    if (current.get(ids.lines[l.n])?.mapping === "Missing") await ensure(author, `${materials}/lines`, { ...base(ids, `binding:proposed:${l.n}`, "SYN candidate item proposed for the target company"), ...binding(l, "Proposed", current.get(ids.lines[l.n])!.version) }, `Proposed binding ${l.n}`);
  current = await versions(coordinator);
  for (const l of lineSpecs.filter((x) => !["040", "080"].includes(x.n)))
    if (current.get(ids.lines[l.n])?.mapping === "Proposed") await ensure(coordinator, `${materials}/lines`, { ...base(ids, `binding:verified:${l.n}`, "SYN item observed for entity SYN-A through the synthetic item adapter"), ...binding(l, "Verified", current.get(ids.lines[l.n])!.version) }, `Verified binding ${l.n}`);

  // Two proposed alternates. CI-120 lacks its firmware evidence; FA-220 is technically complete and waits on a commercial decision.
  const proposals = ((await engineer(`${materials}/substitutions?set=${ids.set}`)).body as { items: { id: string; version: number; state: string }[] }).items;
  const propose = async (id: string, line: keyof ScenarioIds["lines"], body: Record<string, unknown>) => {
    if (!proposals.some((s) => s.id === id)) await ensure(engineer, `${materials}/substitutions`, { ...base(ids, `alternate:propose:${line}`, "SYN alternate proposed against the exact requirement"), action: "propose", id, line_id: ids.lines[line], ...body }, `Alternate for ${line}`);
    const now = ((await engineer(`${materials}/substitutions?set=${ids.set}`)).body as { items: { id: string; version: number; state: string }[] }).items.find((s) => s.id === id)!;
    if (now.state === "Draft") await ensure(engineer, `${materials}/substitutions`, { ...base(ids, `alternate:submit:${line}`, "SYN comparison submitted for independent review"), action: "submit", substitution_id: id, expected_version: now.version }, `Submit alternate for ${line}`);
  };
  await propose(ids.substitution030, "030", {
    candidate_code: "CI-120", candidate_description: "Alternate control interface", candidate_manufacturer: "SYN Fictional Controls", candidate_revision: "r2", candidate_item_key: "SYN-ITM-CI-120",
    proposal_reason: "The specified CI-100 has a long fictional lead time; CI-120 is offered as an alternate.", scope_quantity: "1",
    criteria: [
      criterion("physical", "Physical connections", true, "Meets", "SYN data sheet CI-120 section 2"), criterion("electrical", "Electrical interface", true, "Meets", "SYN data sheet CI-120 section 3"),
      criterion("firmware", "Firmware compatibility", true, "EvidenceNeeded", null, "Supplier firmware statement for the pump controller is outstanding."),
      criterion("commissioning", "Commissioning requirements", false, "EvidenceNeeded", null, "Retest list to be agreed with EN-08."),
    ],
    impacts: [{ area: "Commissioning", effect: "Controller parameters and retest are required if adopted.", owner: "EN-08 commissioning" }], commercial_state: "NotAssessed",
  });
  await propose(ids.substitution080, "080", {
    candidate_code: "FA-220", candidate_description: "Alternate disc filter 120 mesh", candidate_manufacturer: "SYN Fictional Filtration", candidate_revision: "r1", candidate_item_key: "SYN-ITM-FA-220",
    proposal_reason: "FA-220 is offered as a like-for-like alternate with a different fictional price and lead time.", scope_quantity: "1",
    criteria: [
      criterion("function", "Intended function and performance", true, "Meets", "SYN comparison sheet FA-220 v1"), criterion("physical", "Physical connections", true, "Meets", "SYN comparison sheet FA-220 v1"),
      criterion("environment", "Horticultural environment", true, "Meets", "SYN fertiliser compatibility note FA-220"), criterion("delivery", "Commercial and delivery effects", false, "NotApplicable", null, "Assessed separately by the commercial coordinator."),
    ],
    impacts: [{ area: "Customer scope and price", effect: "A different filter model may change the quoted scope; the effect is unknown until decided.", owner: "Project commercial coordinator" }],
    commercial_state: "DecisionNeeded", commercial_owner_id: MATERIALS.coordinator.id,
  });

  // Fixture B beside it: the same package, a set whose only line rests on coordination-only issues. It can be prepared and
  // inspected, and no procurement release can come from it.
  await ensure(author, materials, { ...base(ids, "set:B", "SYN coordination-only negative fixture"), action: "create", id: ids.setB, set_code: "B", revision: 1, title: "Propagation reticulation (coordination issue only)" }, "Material set B");
  await ensure(author, `${materials}/lines`, { ...base(ids, "line:B:010", "SYN requirement taken from a coordination-only issue"), ...lineBody({ n: "010", description: "Reticulation manifold", category: "Pipe and tube", discipline: "Hydraulics", system: "Propagation reticulation", location: "Propagation house 01", served: ["Propagation house 01"], quantity: "2", unit: "EA", basis: "Two manifolds on H-190.", model: "Reticulation manifold", product: "RM-002", owner: "author", action: "Wait for a procurement-capable issue from the drawing owner", due: null, required_by: null }, ids.setB, ids.heldLine, ids.coordinationDrawing, ids.coordinationBasis) }, "Held line");
  return { package_id: ids.package, set_id: ids.set, href: `/engineering/${ids.package}/materials` };
}
