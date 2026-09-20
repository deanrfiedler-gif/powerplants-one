// The EN-07 review scenario of desktop mockup r02, built through the application's ordinary commands by the
// fictional people who would do each step. Nothing is written to the database directly and no step borrows
// authority: authors author, the reviewer reviews, the technical authority decides, each receiver answers for
// their own destination, the verifier records the test, and the coordinator operates the synthetic upstream
// adapter. It stands on the EN-06 scenario's package, so a change links real released-material lines and real
// retained drawing issues. It never supersedes a source an EN-06 line rests on, so EN-06's own review scenario
// keeps its figures. With fixed identities a rerun finds each step already done and changes nothing.
import { createHash, randomUUID } from "node:crypto";
import { CRM } from "./crm";
import { MATERIALS, scenarioIds as materialIds, seedMaterialsScenario, type Call, type ScenarioIds as MaterialIds, type SignIn } from "./engineering-materials";

export const CHANGES = {
  ...MATERIALS,
  authority: MATERIALS.release, // SYN Drew: technical decision authority and change closer under the change policy
  releaseOwner: { profile: "changes-release-owner", id: "30000000-0000-4000-8000-000000000022", name: "SYN Riley Drawing issue owner" },
  service: { profile: "changes-service", id: "30000000-0000-4000-8000-000000000023", name: "SYN Jamie Service coordinator" },
  verifier: { profile: "changes-verifier", id: "30000000-0000-4000-8000-000000000024", name: "SYN Taylor Commissioning verifier" },
} as const;

type Ref = "001" | "002" | "003" | "004" | "005" | "006" | "007" | "008";
function stableId(key: string) {
  const h = createHash("sha256").update(`ppo-en07-scenario:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export function changeScenarioIds(fixed: boolean) {
  const id = (key: string) => (fixed ? stableId(key) : randomUUID()), made = new Map<string, string>();
  // One identity per named thing, stable across reruns of the demonstration and fresh for every browser journey.
  const named = (key: string) => made.get(key) ?? made.set(key, id(key)).get(key)!;
  return { fixed, materials: materialIds(fixed), named, op: (step: string) => (fixed ? stableId(`operation:${step}`) : randomUUID()) };
}
export type ChangeScenarioIds = ReturnType<typeof changeScenarioIds>;

const base = (ids: ChangeScenarioIds, step: string, reason: string) => ({ operation_id: ids.op(step), schema_version: 1, reason });
async function must(call: Call, path: string, body: unknown, what: string) {
  const r = await call(path, body);
  if (![200, 201].includes(r.status)) throw Error(`${what} failed (${r.status}): ${JSON.stringify(r.body)}`);
  return r.body as { record_version: number; state: string };
}
type Detail = {
  change: { id: string; version: number; stage: string }; revision: { id: string; version: number; state: string; number: number };
  reviews: { id: string; version: number; reviewer_id: string; result: string | null }[]; decision: { result: string } | null;
  prerequisites: { id: string; version: number; kind: string; state: string; applicability: string }[];
  requests: { id: string; version: number; purpose: string; destination: string; state: string; latest_submission_id: string }[];
  verification: { id: string; attempts: { result: string }[] }[]; inspector: { attention: string; sources: { condition: string } };
};
const read = async (call: Call, pkg: string, change: string) => ((await call(`engineering/${pkg}/changes/impact?change=${change}`)).body as { selected: Detail | null }).selected;

type Spec = {
  ref: Ref; title: string; category: string; discipline: string; location: string; system: string; author: "author" | "engineer"; owner: "author" | "engineer"; due: string | null;
  drawing: [reference: string, from: string, to: string, title: string]; rationale: string; compare: [string, string, string]; evidenceNeeded?: string; target: "Draft" | "Assessing" | "InReview" | "Returned" | "Accepted";
  lines?: (keyof MaterialIds["lines"])[]; asset?: boolean; retest?: { system: string; criterion: string; configuration: string; procedure: string }; cost?: "impact" | "none"; release?: boolean; purpose?: string;
};
const specs: Spec[] = [
  { ref: "001", title: "Valve assembly substitution", category: "SupplierProductChange", discipline: "Hydraulics", location: "Greenhouse 01", system: "Irrigation supply", author: "author", owner: "author", due: "2026-09-21", drawing: ["H-102", "B", "C", "Greenhouse 01 isolation schedule"], rationale: "The specified isolation valve assembly has a long fictional lead time; an alternate assembly with the same connections is proposed.", compare: ["Isolation valve assembly", "IV-050", "IV-055"], lines: ["020"], target: "InReview", cost: "none" },
  { ref: "002", title: "Pump duty amendment", category: "RequirementChange", discipline: "Hydraulics", location: "Irrigation Shed 01", system: "Irrigation supply", author: "engineer", owner: "engineer", due: "2026-09-21", drawing: ["H-101", "C", "D", "Pump station hydraulic arrangement"], rationale: "The customer added a nursery pad, so the duty point of the irrigation pump is re-examined.", compare: ["Duty flow", "SYN basis value r02", "SYN proposed value r03"], lines: ["010"], target: "Assessing", cost: "none" },
  { ref: "003", title: "Control interface revision", category: "SupplierProductChange", discipline: "Controls", location: "Irrigation Shed 01", system: "Controls", author: "engineer", owner: "engineer", due: "2026-09-22", drawing: ["E-201", "C", "D", "Irrigation control interface wiring"], rationale: "The CI-100 control interface is superseded by its fictional supplier; the CI-120 needs a revised termination arrangement on E-201.", compare: ["Control interface module", "CI-100", "CI-120 r2"], lines: ["030", "010"], asset: true, retest: { system: "Control interface", criterion: "Pump controller handshake and fail-safe state, as defined by the linked synthetic procedure", configuration: "CI-120 r2 terminated to E-201 revision D", procedure: "TP-E201" }, cost: "impact", target: "Accepted", purpose: "Procurement" },
  { ref: "004", title: "Sensor relocation", category: "SiteDiscrepancy", discipline: "Controls", location: "Propagation House", system: "Climate sensing", author: "author", owner: "author", due: "2026-09-23", drawing: ["E-204", "A", "B", "Propagation house sensor layout"], rationale: "The as-found bench layout shades the specified sensor position; a relocated mounting point is proposed.", compare: ["Sensor mounting position", "Bench row 2", "Bench row 4"], target: "InReview", cost: "none" },
  { ref: "005", title: "Pipework reroute", category: "InterfaceConflict", discipline: "Hydraulics", location: "Greenhouse 02", system: "Irrigation distribution", author: "author", owner: "engineer", due: "2026-09-24", drawing: ["H-110", "B", "C", "Greenhouse 02 distribution pipework"], rationale: "The specified pipe route clashes with a fictional structural brace; a reroute is proposed.", compare: ["Pipe route", "Along gridline C", "Along gridline D"], target: "Returned", cost: "none" },
  { ref: "006", title: "Filter access clearance", category: "DesignCorrection", discipline: "Mechanical", location: "Irrigation Shed 01", system: "Filtration", author: "author", owner: "author", due: "2026-09-25", drawing: ["M-106", "A", "B", "Filter station arrangement"], rationale: "The filter station leaves too little room to withdraw the disc stack; the arrangement is corrected.", compare: ["Withdrawal clearance", "SYN as drawn", "SYN as corrected"], evidenceNeeded: "Supplier withdrawal-clearance statement is outstanding.", target: "Assessing", cost: "none" },
  { ref: "007", title: "Commissioning logic update", category: "DesignCorrection", discipline: "Controls", location: "Shared controls", system: "Irrigation sequencing", author: "engineer", owner: "engineer", due: "2026-09-25", drawing: ["E-205", "B", "C", "Irrigation sequencing logic"], rationale: "The start sequence allows two zones to open together; the interlock logic is corrected.", compare: ["Zone interlock", "Permissive", "Exclusive"], retest: { system: "Commissioning logic", criterion: "Zone interlock sequence, as defined by the linked synthetic procedure", configuration: "Sequencing logic to E-205 revision C", procedure: "TP-E205" }, cost: "none", release: true, target: "Accepted", purpose: "Installation" },
  { ref: "008", title: "Valve isolation arrangement", category: "FieldRedline", discipline: "Hydraulics", location: "Greenhouse 01", system: "Irrigation supply", author: "author", owner: "author", due: null, drawing: ["H-108", "A", "B", "Greenhouse 01 isolation arrangement"], rationale: "A field redline proposes one further isolation point for maintenance.", compare: ["Isolation points", "6", "7"], target: "Draft" },
];
const categoryLabels = { function: "function", interfaces: "interfaces", materials: "materials and supply", installed: "installed configuration", site: "work method and site", retest: "retest" } as const;

export async function seedChangesScenario(as: SignIn, ids: ChangeScenarioIds, tag = "") {
  const built = await seedMaterialsScenario(as, ids.materials, tag), pkg = built.package_id, changes = `engineering/${pkg}/changes`, materials = `engineering/${pkg}/materials`;
  const coordinator = await as(CHANGES.coordinator.profile), people = { author: await as(CHANGES.author.profile), engineer: await as(CHANGES.engineer.profile) };
  const reviewer = await as(CHANGES.reviewer.profile), authority = await as(CHANGES.authority.profile), supply = await as(CHANGES.supply.profile), releaseOwner = await as(CHANGES.releaseOwner.profile),
    service = await as(CHANGES.service.profile), verifier = await as(CHANGES.verifier.profile);

  // The synthetic upstream adapter, operated by the coordinator. Drawings that EN-06 already retains are reused by identity.
  const sources = async () => ((await coordinator(`${materials}/sources`)).body as { items: { id: string; kind: string; reference: string; revision: string; use: string }[] }).items;
  const publish = async (key: string, kind: string, reference: string, revision: string, title: string, purpose: string, supersedes: string | null = null) => {
    const found = (await sources()).find((s) => s.kind === kind && s.reference === reference && s.revision === revision);
    if (found) return found.id;
    const id = ids.named(`source:${key}`);
    await must(coordinator, `${materials}/sources`, { ...base(ids, `source:${key}`, "SYN source observed through the synthetic upstream adapter"), action: "publish", id, kind, reference, title, revision, file_version: "1.0", permitted_purpose: purpose, supersedes_id: supersedes,
      content: `SYNTHETIC ${kind} ${reference} revision ${revision}: ${title}. Authored for the EN-07 demonstration; it is not an issued Powerplants document and states no engineering limit.` }, `Source ${reference} ${revision}`);
    return id;
  };
  const drawing = new Map<Ref, string>();
  for (const s of specs) drawing.set(s.ref, await publish(`drawing:${s.drawing[0]}:${s.drawing[1]}`, "DrawingIssue", s.drawing[0], s.drawing[1], s.drawing[3], "Procurement"));
  const procedures = new Map<string, string>();
  for (const [reference, title] of [["TP-E201", "Control interface handshake test procedure"], ["TP-E205", "Zone interlock sequence test procedure"]] as const) procedures.set(reference, await publish(`procedure:${reference}`, "TestProcedure", reference, "r1", title, "InformationOnly"));
  const curve = await publish("evidence:curve:r1", "CompatibilityEvidence", "PA-300 curve", "r1", "Duty pump performance curve (fictional)", "InformationOnly");

  // One installed asset at the site: the pump controller. It sits in the shed and serves three areas; it is one asset.
  const asset = ids.named("asset:controller");
  if ((await coordinator(`assets/${asset}`)).status !== 200)
    await must(coordinator, "assets", { ...base(ids, "asset:controller", "SYN installed asset for the EN-07 review scenario"), id: asset, company_id: CRM.company, site_id: ids.materials.site, description: `SYN Irrigation pump controller${tag}`, identity_status: "Verified", manufacturer: "SYN Fictional Controls", model: "PC-200", lifecycle_status: "Active", installed_on: "2025-11-03", effective_at: "2025-11-03T00:00:00.000Z" }, "Installed asset");
  const assetRef = ((await coordinator(`assets/${asset}`)).body as { asset?: { display_number: string }; display_number?: string });
  const assetNumber = assetRef.asset?.display_number ?? assetRef.display_number ?? "SYN asset";

  const lineNames: Record<string, string> = { "010": "Pump assembly", "020": "Isolation valve set", "030": "Control interface module" };
  const documentOf = (s: Spec) => {
    const owner = CHANGES[s.owner].id, finding = (what: string) => `SYN assessed for ${what}: the change is confined to ${s.drawing[0]} and the objects listed.`;
    const technical = (Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]).map((key) =>
      key === "site" && s.evidenceNeeded ? { key, status: "EvidenceNeeded", impact: null, finding: s.evidenceNeeded, reason: null, evidence: null, owner_id: owner }
        : key === "retest" ? (s.retest ? { key, status: "Assessed", impact: "Impact", finding: `Retest of the ${s.retest.system.toLowerCase()} is required after the change.`, reason: null, evidence: `${s.retest.procedure} r1`, owner_id: CHANGES.verifier.id } : { key, status: "NotApplicable", impact: null, finding: null, reason: "SYN no tested criterion or commissioned configuration is touched.", evidence: null, owner_id: null })
        : key === "installed" && !s.asset ? { key, status: "Assessed", impact: "NoImpact", finding: "No installed asset is recorded in the affected scope.", reason: "SYN the affected items are not yet installed.", evidence: null, owner_id: null }
        : { key, status: "Assessed", impact: "Impact", finding: finding(categoryLabels[key]), reason: null, evidence: `${s.drawing[0]} revision ${s.drawing[1]}`, owner_id: null });
    const cost = s.cost === "impact" ? { key: "cost", status: "Assessed", impact: "Impact", finding: "The replacement module has a known fictional cost; remobilisation is unknown.", reason: null, evidence: null, owner_id: CHANGES.coordinator.id }
      : { key: "cost", status: "NotApplicable", impact: null, finding: null, reason: "SYN like-for-like within the quoted scope; the commercial coordinator is not asked to decide anything.", evidence: null, owner_id: null };
    return {
      title: s.title, category: s.category, discipline: s.discipline, location: s.location, system_name: s.system, rationale: `SYN ${s.rationale}`, proposed_reference: s.drawing[0], proposed_revision: s.drawing[2],
      scope_statement: `SYN whole scope of ${s.drawing[0]} as listed; nothing is staged or partial.`, requires_revised_release: true,
      comparison: [{ attribute: s.compare[0], unit: null, current: s.compare[1], proposed: s.compare[2], note: "Entered structured attribute; no drawing geometry is compared." }],
      options: [{ key: "retain", kind: "RetainCurrent", label: "Retain the current design", assumptions: null, impacts: "The reason for the change remains.", evidence: null }, { key: "adopt", kind: "AdoptProposed", label: "Adopt the proposed change", assumptions: "SYN the successor issue is prepared by its owner.", impacts: null, evidence: null }], selected_option: "adopt",
      categories: [...technical, cost, { key: "dates", status: "NotApplicable", impact: null, finding: null, reason: "SYN no supplier promise, forecast or confirmed appointment is touched.", evidence: null, owner_id: null }, { key: "recipients", status: "Assessed", impact: "Impact", finding: "The release owner and the receiving owners named in the handover.", reason: null, evidence: null, owner_id: null }],
      costs: s.cost === "impact" ? [{ key: "module", label: "Replacement interface module", kind: "Cost", amount: "1250.00", currency: "AUD", tax_basis: "ExTax", observed_on: "2026-09-18", source: "SYN fictional supplier quotation", confidence: "Quoted" }, { key: "remobilisation", label: "Remobilisation", kind: "Cost", amount: null, currency: "AUD", tax_basis: "ExTax", observed_on: null, source: null, confidence: null }] : [],
      dates: [],
      objects: [
        ...(s.asset ? [{ id: ids.named(`object:${s.ref}:asset`), object_type: "InstalledAsset", object_id: asset, reference: assetNumber, title: "Irrigation pump controller", current_state: "Installed and active", proposed_effect: "Interface module replaced and re-terminated", relation: `Shown on ${s.drawing[0]}`, disposition: "Included", location: s.location, served_areas: ["Propagation house 01", "Greenhouse 01", "Nursery pad 02"] }] : []),
        ...(s.lines ?? []).map((n) => ({ id: ids.named(`object:${s.ref}:line:${n}`), object_type: "MaterialLine", object_id: ids.materials.lines[n], reference: `Line ${n} (set A)`, title: lineNames[n] ?? `Line ${n}`, current_state: "Released-materials requirement", proposed_effect: "Requirement reassessed against the proposed revision", relation: "Material line resting on this change's sources, or in its dependency group", disposition: "Included", location: s.location, served_areas: [] })),
        ...(!s.asset && !(s.lines ?? []).length ? [{ id: ids.named(`object:${s.ref}:drawing`), object_type: "DrawingIssue", object_id: drawing.get(s.ref), reference: `${s.drawing[0]} revision ${s.drawing[1]}`, title: s.drawing[3], current_state: "Issued", proposed_effect: `Successor revision ${s.drawing[2]} required`, relation: "The baseline drawing itself", disposition: "Included", location: s.location, served_areas: [] }] : []),
      ],
      sources: [{ source_id: drawing.get(s.ref), role: "Baseline", required: true }, ...(s.ref === "002" ? [{ source_id: curve, role: "Evidence", required: true }] : []), ...(s.retest ? [{ source_id: procedures.get(s.retest.procedure), role: "TestProcedure", required: true }] : [])],
      retests: s.retest ? [{ id: ids.named(`retest:${s.ref}`), criterion: s.retest.criterion, requirement_ref: null, asset_or_system: s.retest.system, configuration: s.retest.configuration, procedure_source_id: procedures.get(s.retest.procedure), reason: "The changed configuration alters a tested behaviour.", verifier_id: CHANGES.verifier.id, due: null }] : [],
    };
  };

  const changeIds = {} as Record<Ref, string>;
  for (const s of specs) {
    const id = (changeIds[s.ref] = ids.named(`change:${s.ref}`)), author = people[s.author], step = (name: string) => `change:${s.ref}:${name}`;
    let d = await read(author, pkg, id);
    if (!d) {
      await must(author, changes, { ...base(ids, step("create"), "SYN proposed engineering change"), action: "create", id, revision_id: ids.named(`revision:${s.ref}:1`), title: s.title, category: s.category, discipline: s.discipline, location: s.location, system_name: s.system, next_owner_id: CHANGES[s.owner].id, due: s.due }, `Change ${s.ref}`);
      d = (await read(author, pkg, id))!;
      await must(author, `${changes}/impact`, { ...base(ids, step("save"), "SYN exact baseline, proposal and assessment captured"), action: "save", change_id: id, revision_id: d.revision.id, expected_version: d.revision.version, ...documentOf(s) }, `Proposal ${s.ref}`);
      d = (await read(author, pkg, id))!;
    }
    if (s.target !== "Draft" && d.change.stage === "Draft") { await must(author, `${changes}/impact`, { ...base(ids, step("begin"), "SYN assessment started"), action: "begin", change_id: id, expected_version: d.change.version }, `Begin ${s.ref}`); d = (await read(author, pkg, id))!; }
    if (["InReview", "Returned", "Accepted"].includes(s.target) && d.change.stage === "Assessing" && d.revision.number === 1) {
      await must(author, `${changes}/impact`, { ...base(ids, step("submit"), "SYN submitted for independent review"), action: "submit", change_id: id, revision_id: d.revision.id, expected_version: d.revision.version, reviewers: [{ id: ids.named(`review:${s.ref}`), discipline: s.discipline, reviewer_id: CHANGES.reviewer.id, required: true }] }, `Submit ${s.ref}`);
      d = (await read(author, pkg, id))!;
    }
    if (s.target === "Returned" && d.change.stage === "InReview")
      await must(authority, `${changes}/reviews`, { ...base(ids, step("return"), "SYN returned for scope clarification"), action: "return", change_id: id, revision_id: d.revision.id, expected_version: d.change.version, return_kind: "ScopeClarification", decision_reason: "SYN say whether the reroute also moves the Greenhouse 02 isolation point, and include or exclude it with a reason.", owner_id: CHANGES[s.owner].id, due: s.due }, `Return ${s.ref}`);
    if (s.target === "Accepted" && d.change.stage === "InReview") {
      const mine = d.reviews.find((r) => r.reviewer_id === CHANGES.reviewer.id && !r.result);
      if (mine) await must(reviewer, `${changes}/reviews`, { ...base(ids, step("respond"), "SYN independent discipline review"), action: "respond", change_id: id, review_id: mine.id, expected_version: mine.version, result: "NoBlockingFinding", findings: "SYN the comparison, affected scope and retest definition are consistent with the linked sources." }, `Review ${s.ref}`);
      d = (await read(author, pkg, id))!;
      await must(authority, `${changes}/reviews`, { ...base(ids, step("decide"), "SYN independent technical decision"), action: "decide", change_id: id, revision_id: d.revision.id, expected_version: d.change.version, id: ids.named(`decision:${s.ref}`), result: "Accepted", purpose: s.purpose, decision_reason: "SYN accepted on the exact submitted revision. This is a bounded technical decision: it issues no drawing, releases no material and approves no cost." }, `Decide ${s.ref}`);
    }
  }

  // Requests. Each is previewed by the server first, and confirmed only with the hash of exactly what was previewed.
  const confirm = async (call: Call, ref: Ref, name: string, requests: Record<string, unknown>[]) => {
    const id = changeIds[ref], d = (await read(call, pkg, id))!;
    if (requests.every((r) => d.requests.some((x) => x.purpose === r.purpose && x.destination === r.destination))) return;
    const preview = (await call(`${changes}/handovers/preview?change=${id}&requests=${encodeURIComponent(JSON.stringify(requests))}`)).body as { preview_hash: string; blocked: boolean; requests: { blockers: string[] }[] };
    if (preview.blocked) throw Error(`${name} is blocked: ${preview.requests.flatMap((r) => r.blockers).join(" ")}`);
    await must(call, `${changes}/handovers`, { ...base(ids, `change:${ref}:${name}`, "SYN exact previewed requests confirmed"), action: "confirm", change_id: id, expected_version: d.change.version, preview_hash: preview.preview_hash, requests }, name);
  };
  const request = (ref: Ref, key: string, purpose: string, destination: string, owner: string, action: string, due: string | null) => ({ id: ids.named(`request:${ref}:${key}`), purpose, destination, owner_id: owner, requested_action: action, due });
  const decide = async (call: Call, ref: Ref, destination: string, purpose: string, outcome: string, reason: string) => {
    const d = (await read(call, pkg, changeIds[ref]))!, r = d.requests.find((x) => x.destination === destination && x.purpose === purpose)!;
    if (r.state === "Pending") await must(call, `${changes}/handovers`, { ...base(ids, `change:${ref}:receive:${destination}:${purpose}`, "SYN receiving owner's own outcome"), action: "decide", change_id: changeIds[ref], handover_id: r.id, submission_id: r.latest_submission_id, expected_version: r.version, outcome, outcome_reason: reason }, `${destination} ${outcome}`);
  };
  // 002: an investigation before any decision exists. Then one required evidence source moves on upstream.
  await confirm(people.engineer, "002", "impact-review", [request("002", "projects", "ImpactReview", "Projects", CHANGES.coordinator.id, "SYN say whether the added nursery pad changes the programme or the quoted scope.", "2026-09-24")]);
  await publish("evidence:curve:r2", "CompatibilityEvidence", "PA-300 curve", "r2", "Duty pump performance curve (fictional, reissued)", "InformationOnly", curve);
  // 003: accepted, with the commercial review still open. Supply Chain is asked to review; that is not an instruction to implement.
  await confirm(people.engineer, "003", "supply-review", [request("003", "supply", "ImpactReview", "SupplyChain", CHANGES.supply.id, "SYN say whether the CI-100 module is already ordered or received, and what its disposition would be.", "2026-09-23")]);
  // 007: the whole path to a failed retest. Release prepared and issued by its owner, Service accepts, Commissioning is still to answer.
  await confirm(people.engineer, "007", "release-request", [request("007", "release", "PrepareRevisedRelease", "TechnicalRelease", CHANGES.releaseOwner.id, "SYN prepare and issue E-205 revision C for the corrected interlock logic.", "2026-09-22")]);
  await decide(releaseOwner, "007", "TechnicalRelease", "PrepareRevisedRelease", "Accepted", "SYN accepted for preparation. Issue follows through the drawing owner's own control.");
  await publish("drawing:E-205:C", "DrawingIssue", "E-205", "C", "Irrigation sequencing logic", "Procurement", drawing.get("007")!);
  await confirm(people.engineer, "007", "implementation", [
    request("007", "service", "Implementation", "Service", CHANGES.service.id, "SYN load the corrected sequencing logic at the next attendance.", "2026-09-24"),
    request("007", "commissioning", "Implementation", "Commissioning", CHANGES.verifier.id, "SYN retest the zone interlock against TP-E205 after the logic is loaded.", "2026-09-25")]);
  await decide(service, "007", "Service", "Implementation", "Accepted", "SYN received for the next attendance. This records receipt of the exact payload, not that any work occurred.");
  const seven = (await read(verifier, pkg, changeIds["007"]))!, retest = seven.verification[0];
  if (retest && !retest.attempts.length)
    await must(verifier, `${changes}/verification`, { ...base(ids, "change:007:attempt:1", "SYN retest recorded from the synthetic inspection fixture"), action: "attempt", id: ids.named("attempt:007:1"), change_id: changeIds["007"], expected_version: seven.change.version, retest_id: retest.id, result: "Failed", tested_at: "2026-09-19T23:30:00.000Z",
      configuration_present: "Sequencing logic to E-205 revision C", evidence_reference: "SYN inspection sheet TP-E205/01", note: "SYN zones 2 and 3 opened together on the second start.", corrective_action: "SYN correct the interlock timer and reload the logic.", corrective_owner_id: CHANGES.engineer.id, corrective_due: "2026-09-25" }, "Failed retest");
  void supply;
  return { package_id: pkg, changes: changeIds, selected: changeIds["003"], href: `/engineering/${pkg}/changes?change=${changeIds["003"]}`, asset_id: asset };
}
