// The EN-08 review scenario of desktop mockup r02, built through the application's ordinary commands by the
// fictional people who would do each step. Nothing is written to the database directly and no step borrows
// authority: preparers prepare, the performer captures and submits, the independent reviewer approves, reviews and
// reconciles, the issue authority issues, each receiver answers for their own destination, and the coordinator
// operates the synthetic upstream adapter. It stands on the EN-06 and EN-07 scenarios' package, so a basis binds
// real retained sources and a referral names a real engineering change. It never supersedes a source those
// scenarios rest on. With fixed identities a rerun finds each step already done and changes nothing.
import { createHash, randomUUID } from "node:crypto";
import { CHANGES, changeScenarioIds, seedChangesScenario } from "./engineering-changes";
import type { Call, SignIn } from "./engineering-materials";

export const COMMISSIONING = {
  ...CHANGES,
  performer: CHANGES.verifier, // SYN Taylor: the assigned test performer
  issuer: CHANGES.authority, // SYN Drew: issue and withdrawal authority
  equipment: { profile: "commissioning-equipment", id: "30000000-0000-4000-8000-000000000025", name: "SYN Morgan Equipment records" },
  instruments: { gauge: "e8100000-0000-4000-8000-000000000001", flow: "e8100000-0000-4000-8000-000000000002", withdrawnGauge: "e8100000-0000-4000-8000-000000000003", light: "e8100000-0000-4000-8000-000000000004" },
} as const;

function stableId(key: string) {
  const h = createHash("sha256").update(`ppo-en08-scenario:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export function commissioningScenarioIds(fixed: boolean) {
  const made = new Map<string, string>(), named = (key: string) => made.get(key) ?? made.set(key, fixed ? stableId(key) : randomUUID()).get(key)!;
  return { fixed, changes: changeScenarioIds(fixed), named, op: (step: string) => (fixed ? stableId(`operation:${step}`) : randomUUID()) };
}
export type CommissioningScenarioIds = ReturnType<typeof commissioningScenarioIds>;
export const day = (offset: number, from = new Date()) => new Date(from.getTime() + offset * 86_400_000).toISOString().slice(0, 10);

const base = (ids: CommissioningScenarioIds, step: string, reason: string) => ({ operation_id: ids.op(step), schema_version: 1, reason });
export async function must(call: Call, path: string, body: unknown, what: string) {
  const r = await call(path, body);
  if (![200, 201].includes(r.status)) throw Error(`${what} failed (${r.status}): ${JSON.stringify(r.body)}`);
  return r.body as { record_version: number; state: string };
}
export type Detail = {
  record: { id: string; version: number; reference: string }; scope: { id: string; version: number; state: string }; bases: { id: string; version: number; state: string; reference: string }[]; draft_attempt_id: string | null;
  attempts: { id: string; version: number; number: string; state: string; review: string; check_keys: string[]; results: { check_key: string; evaluation: string | null }[] }[]; defects: { id: string; version: number; reference: string; state: string; check_key: string; attempts: { relation: string }[]; activity_id: string | null }[];
  configuration: { id: string; version: number; state: string } | null; differences: { id: string; version: number; item_key: string; disposition: string }[]; redlines: { id: string; version: number; reference: string; state: string }[];
  associations: { id: string; version: number; state: string; from_reference: string }[]; backups: { id: string; version: number }[]; obligations: { id: string; version: number; title: string; state: string }[];
  releases: { id: string; version: number; reference: string; state: string; partial: boolean; manifest_hash: string }[]; outputs: { id: string; kind: string; state: string; pdf_sha256: string; release_id: string }[]; gates: { key: string; satisfied: boolean; reasons: string[] }[];
  requests: { id: string; version: number; destination: string; state: string; latest_submission_id: string | null; latest_submission_version: number | null; submissions: { id: string; number: number; outcome: string | null; manifest_hash: string }[] }[];
  inspector: { evidence_view: { label: string }; as_built_view: { label: string }; next: { label: string; action: string }; coverage: { required: number; accepted: number; failed: number } };
};
export const readDetail = async (call: Call, pkg: string, id: string) => ((await call(`engineering/${pkg}/commissioning/results?record=${id}`)).body as { selected: Detail | null }).selected;

// Fictional checks. Every limit exists only to exercise the prototype and is labelled fictional wherever it is shown.
type Check = Record<string, unknown> & { key: string };
export const numeric = (key: string, name: string, lower: string | null, upper: string | null, unit = "kPa", extra: Record<string, unknown> = {}): Check => ({ key, name, check_type: "Numeric", required: true, scope_key: null, numeric: lower === null && upper === null ? null : { unit, precision: 1, lower, lower_inclusive: true, upper, upper_inclusive: true, conversions: unit === "kPa" ? [{ from_unit: "bar", multiply: "100", add: "0" }] : [] }, qualitative: null, condition: null, evidence_min: 0, instrument_required: false, witness: "None", criterion_source_id: null, ...extra });
export const qualitative = (key: string, name: string, extra: Record<string, unknown> = {}): Check => ({ key, name, check_type: "Qualitative", required: true, scope_key: null, numeric: null, qualitative: { choices: ["Operates as specified", "Does not operate as specified"], accepted: ["Operates as specified"] }, condition: null, evidence_min: 0, instrument_required: false, witness: "None", criterion_source_id: null, ...extra });
const functional = (count: number, prefix: string, scope: string | null = null): Check[] => Array.from({ length: count }, (_, i) => (i % 3 === 0 ? numeric(`${prefix}-pressure-${i + 1}`, `SYN zone ${i + 1} holding pressure`, "180.0", "260.0", "kPa", { scope_key: scope, instrument_required: i === 0 }) : qualitative(`${prefix}-function-${i + 1}`, `SYN function check ${i + 1}`, { scope_key: scope })));
const reading = (c: Check, fail = false) => (c.check_type === "Numeric" ? { check_key: c.key, state: "Recorded", value: fail ? "120.5" : "215.0", unit: "kPa" } : { check_key: c.key, state: "Recorded", choice: fail ? "Does not operate as specified" : "Operates as specified" });

type Spec = {
  n: string; title: string; area: string; system: string; owner: "engineer" | "author"; due: number | null; meaning: string | null; stage?: "StagedArea";
  items: { key: string; kind: string; reference: string; title: string; installed_location: string; served_areas: string[] }[]; interfaces?: { key: string; label: string; items: string[]; assessment: string; note: string }[];
  basis: [reference: string, revision: string]; drawing?: [string, string]; configuration: [reference: string, revision: string]; checks: Check[];
};
export type Built = { package_id: string; records: Record<string, string>; selected: string; href: string };

export async function seedCommissioningScenario(as: SignIn, ids: CommissioningScenarioIds, tag = ""): Promise<Built> {
  const upstream = await seedChangesScenario(as, ids.changes, tag), pkg = upstream.package_id, root = `engineering/${pkg}/commissioning`, materials = `engineering/${pkg}/materials`;
  const coordinator = await as(COMMISSIONING.coordinator.profile), people = { engineer: await as(COMMISSIONING.engineer.profile), author: await as(COMMISSIONING.author.profile) }, owners = { engineer: COMMISSIONING.engineer.id, author: COMMISSIONING.author.id };
  const performer = await as(COMMISSIONING.performer.profile), reviewer = await as(COMMISSIONING.reviewer.profile), issuer = await as(COMMISSIONING.issuer.profile), service = await as(COMMISSIONING.service.profile);

  // The synthetic upstream adapter, operated by the coordinator. A source EN-06 or EN-07 already retains is reused by identity.
  const sources = async () => ((await coordinator(`${materials}/sources`)).body as { items: { id: string; kind: string; reference: string; revision: string }[] }).items;
  const publish = async (kind: string, reference: string, revision: string, title: string, supersedes: string | null = null) => {
    const found = (await sources()).find((s) => s.kind === kind && s.reference === reference && s.revision === revision);
    if (found) return found.id;
    const id = ids.named(`source:${kind}:${reference}:${revision}`);
    await must(coordinator, `${materials}/sources`, { ...base(ids, `source:${kind}:${reference}:${revision}`, "SYN source observed through the synthetic upstream adapter"), action: "publish", id, kind, reference, title, revision, file_version: "1.0", permitted_purpose: "InformationOnly", supersedes_id: supersedes,
      content: `SYNTHETIC ${kind} ${reference} revision ${revision}: ${title}. Authored for the EN-08 demonstration; it is not an issued Powerplants document and every limit in it is fictional.` }, `Source ${reference} ${revision}`);
    return id;
  };
  const existing = async () => ((await people.engineer(root)).body as { items: { id: string; reference: string; title: string }[] }).items;

  const specs: Spec[] = [
    { n: "001", title: "Irrigation commissioning", area: "Greenhouse 01", system: "Irrigation", owner: "engineer", due: 2, meaning: "ReviewDue", basis: ["CP-004", "r03"], drawing: ["H-102", "B"], configuration: ["CFG-003", "C"], checks: functional(12, "gh01"),
      items: [{ key: "gh01-irrigation", kind: "System", reference: "GH01-IRR", title: "Greenhouse 01 irrigation", installed_location: "Greenhouse 01", served_areas: ["Greenhouse 01"] }] },
    { n: "002", title: "Lighting verification", area: "Propagation", system: "Supplementary lighting", owner: "author", due: 3, meaning: "ReviewDue", basis: ["CP-011", "r01"], configuration: ["CFG-011", "A"],
      checks: [qualitative("prop-light-switching", "SYN lighting circuit switching"), numeric("prop-par-level", "SYN PAR level at bench height", null, null, "umol"), qualitative("prop-light-failsafe", "SYN lighting fail-safe state")],
      items: [{ key: "prop-lighting", kind: "System", reference: "PROP-LGT", title: "Propagation house lighting", installed_location: "Propagation house 01", served_areas: ["Propagation house 01"] }] },
    { n: "003", title: "Pump duty test", area: "Irrigation Shed 01", system: "Irrigation supply", owner: "engineer", due: 3, meaning: "TestWindowCloses", basis: ["CP-006", "r02"], configuration: ["CFG-006", "B"], checks: functional(4, "pump"),
      // One pump in one shed serving three areas: one scope item, with the areas it serves listed on it.
      items: [{ key: "pump-p01", kind: "Asset", reference: "P-01", title: "Irrigation pump assembly", installed_location: "Irrigation Shed 01", served_areas: ["Propagation house 01", "Greenhouse 01", "Nursery pad 02"] }] },
    { n: "004", title: "Valve & sensor mapping", area: "Greenhouse 02", system: "Irrigation control", owner: "author", due: 4, meaning: "ReviewDue", basis: ["CP-009", "r01"], configuration: ["CFG-004", "A"], checks: functional(3, "gh02"),
      items: [{ key: "gh02-control", kind: "System", reference: "GH02-CTL", title: "Greenhouse 02 valve and sensor control", installed_location: "Greenhouse 02", served_areas: ["Greenhouse 02"] }] },
    { n: "005", title: "Irrigation stage 1", area: "Growing Block A", system: "Irrigation", owner: "engineer", due: 4, meaning: "ReleaseTarget", stage: "StagedArea", basis: ["CP-012", "r01"], configuration: ["CFG-012", "A"], checks: [...functional(8, "blocka", "block-a"), ...functional(3, "blockb", "block-b")],
      items: [{ key: "block-a", kind: "Area", reference: "BLK-A", title: "Growing Block A irrigation", installed_location: "Growing Block A", served_areas: ["Growing Block A"] }, { key: "block-b", kind: "Area", reference: "BLK-B", title: "Growing Block B irrigation", installed_location: "Growing Block B", served_areas: ["Growing Block B"] }],
      interfaces: [{ key: "shared-pump-control", label: "Shared pump and control interface", items: ["block-a", "block-b"], assessment: "Independent", note: "SYN assessment: each block has its own isolation and control channel; the shared pump duty was accepted under SYN-EN08-003's basis." }] },
    { n: "006", title: "Control system handover", area: "Control room", system: "Controls", owner: "author", due: 5, meaning: "HandoverTarget", basis: ["CP-014", "r02"], configuration: ["CFG-014", "B"], checks: functional(9, "ctl"),
      items: [{ key: "control-system", kind: "System", reference: "CTL-01", title: "Irrigation control system", installed_location: "Control room", served_areas: ["Greenhouse 01", "Greenhouse 02", "Growing Block A"] }] },
    { n: "007", title: "Fertigation support pack", area: "Irrigation Shed 01", system: "Fertigation", owner: "engineer", due: 5, meaning: "HandoverTarget", basis: ["CP-015", "r01"], configuration: ["CFG-015", "A"], checks: functional(10, "fert"),
      items: [{ key: "fertigation-skid", kind: "System", reference: "FRT-01", title: "Fertigation dosing skid", installed_location: "Irrigation Shed 01", served_areas: ["Greenhouse 01", "Greenhouse 02"] }] },
    { n: "008", title: "Backup verification", area: "Shared controls", system: "Controls", owner: "author", due: null, meaning: null, basis: ["CP-016", "r01"], configuration: ["CFG-016", "A"], checks: functional(2, "bkp"),
      items: [{ key: "controller-backup", kind: "System", reference: "CTL-BKP", title: "Controller configuration backup", installed_location: "Control room", served_areas: [] }] },
  ];

  const records: Record<string, string> = {}, present = await existing();
  for (const s of specs) {
    const id = (records[s.n] = ids.named(`record:${s.n}`)), me = people[s.owner], step = (name: string) => `record:${s.n}:${name}`, R = (what: string) => `SYN EN-08 review scenario: ${what}`;
    const body = (name: string, what: string, rest: Record<string, unknown>) => ({ ...base(ids, step(name), R(what)), record_id: id, ...rest });
    const read = async (call: Call = me) => (await readDetail(call, pkg, id))!;
    if (!present.some((r) => r.id === id)) await must(me, root, { ...base(ids, step("create"), R("package")), action: "create", id, scope_id: ids.named(`scope:${s.n}`), title: `${s.title}${tag}`, system_name: s.system, area: s.area, owner_id: owners[s.owner], due: s.due === null ? null : day(s.due), due_meaning: s.meaning, release_stage: s.stage ?? "WholeScope" }, `Package ${s.n}`);
    let d = await read();
    if (d.scope.state === "Working" && !d.bases.length) await must(me, root, body("scope", "scope", { action: "scope", scope_id: d.scope.id, expected_version: d.scope.version, statement: `SYN scope of ${s.title.toLowerCase()}.`, items: s.items.map((i) => ({ ...i, asset_id: null, disposition: "Included", exclusion_reason: null, critical: false })), interfaces: s.interfaces ?? [] }), "Scope");

    // Test basis: exact procedure, intended drawing and intended configuration, prepared by the owner and approved by the independent reviewer.
    if (!d.bases.length) {
      const procedure = await publish("TestProcedure", s.basis[0], s.basis[1], `${s.title} commissioning procedure`), drawing = s.drawing ? await publish("DrawingIssue", s.drawing[0], s.drawing[1], "Greenhouse 01 isolation schedule") : null, configuration = await publish("InstalledConfiguration", s.configuration[0], s.configuration[1], `${s.title} intended configuration`);
      const basisId = ids.named(`basis:${s.n}`);
      d = await read();
      await must(me, `${root}/basis`, body("basis:create", "test basis", { action: "create", id: basisId, expected_version: d.record.version, reference: s.basis[0], revision: s.basis[1] }), "Basis");
      await must(me, `${root}/basis`, body("basis:save", "test basis content", { action: "save", basis_id: basisId, expected_version: 1, reference: s.basis[0], revision: s.basis[1], procedure_source_id: procedure, drawing_source_id: drawing, configuration_source_id: configuration, checks: s.checks,
        prerequisites: [{ key: "isolation", label: "SYN isolation and access confirmed with the site", kind: "Isolation", mandatory: true, source: "SYN site access note" }, { key: "biosecurity", label: "SYN biosecurity entry requirements met", kind: "Biosecurity", mandatory: true, source: "SYN site induction" }] }), "Basis content");
      await must(me, `${root}/basis`, body("basis:submit", "test basis for approval", { action: "submit", basis_id: basisId, expected_version: 2 }), "Basis submit");
      await must(reviewer, `${root}/basis`, body("basis:approve", "independent approval for test", { action: "approve", basis_id: basisId, expected_version: 3, decision_reason: "SYN: procedure and criteria reviewed against the bound sources. Approved for commissioning test only." }), "Basis approve");
    }
    const attempt = async (name: string, fail: string[], occurred: string, instrument: string | null, predecessor: string | null, checks: string[] = []) => {
      d = await read(performer);
      if (d.attempts.some((a) => a.id === ids.named(`attempt:${s.n}:${name}`) && a.state === "Submitted")) return ids.named(`attempt:${s.n}:${name}`);
      const attemptId = ids.named(`attempt:${s.n}:${name}`);
      if (!d.attempts.some((a) => a.id === attemptId)) await must(performer, `${root}/results`, body(`attempt:${name}:open`, "test attempt", { action: "open", id: attemptId, expected_version: d.record.version, check_keys: checks, scope_keys: [], predecessor_id: predecessor }), `Attempt ${name}`);
      let a = (await read(performer)).attempts.find((x) => x.id === attemptId)!;
      const chosen = s.checks.filter((c) => a.check_keys.includes(c.key));
      await must(performer, `${root}/results`, body(`attempt:${name}:save`, "readings as captured", { action: "save", attempt_id: attemptId, expected_version: a.version, configuration_reference: `${s.configuration[0]} Rev ${s.configuration[1]}`, occurred_at: occurred, timezone: "Australia/Brisbane",
        prerequisites: [{ key: "isolation", label: "SYN isolation and access confirmed with the site", kind: "Isolation", mandatory: true, met: true, source: "SYN site access note" }, { key: "biosecurity", label: "SYN biosecurity entry requirements met", kind: "Biosecurity", mandatory: true, met: true, source: "SYN site induction" }],
        findings: fail.length ? "SYN: one check did not meet its fictional criterion." : null, readings: chosen.map((c) => (c.numeric === null && c.check_type === "Numeric" ? { check_key: c.key, state: "Recorded", value: "412.0", unit: "umol" } : reading(c, fail.includes(c.key)))), instrument_ids: instrument ? [instrument] : [] }), `Attempt ${name} readings`);
      a = (await read(performer)).attempts.find((x) => x.id === attemptId)!;
      await must(performer, `${root}/results`, body(`attempt:${name}:submit`, "attempt as performed", { action: "submit", attempt_id: attemptId, expected_version: a.version, owner_id: owners[s.owner], due: day(s.due ?? 5), severity: "Major" }), `Attempt ${name} submit`);
      return attemptId;
    };
    const review = async (name: string, attemptId: string, decision: string, why: string) => {
      const a = (await read(reviewer)).attempts.find((x) => x.id === attemptId)!;
      if (a.review === "InReview") await must(reviewer, `${root}/results`, body(`review:${name}`, "independent evidence review", { action: "review", id: ids.named(`review:${s.n}:${name}`), attempt_id: attemptId, decision, decision_reason: why, ...(decision === "Accepted" ? {} : { owner_id: owners[s.owner], due: day(s.due ?? 5) }) }), `Review ${name}`);
    };
    const passAll = async (occurred: string, instrument: string | null = COMMISSIONING.instruments.flow) => review("01", await attempt("01", [], occurred, instrument, null), "Accepted", "SYN: readings, instrument and evidence reviewed against the approved basis. Accepted.");
    const reconcile = async (items: [key: string, component: string, intended: string, observed: string][]) => {
      d = await read();
      if (d.configuration?.state === "Reconciled") return;
      const configurationId = ids.named(`configuration:${s.n}`);
      if (!d.configuration) await must(me, `${root}/configuration`, body("configuration", "installed configuration as observed", { action: "snapshot", id: configurationId, expected_version: d.record.version, installed_reference: s.configuration[0], installed_revision: s.configuration[1] }), "Configuration");
      for (const [key, component, intended, observed] of items) if (!(await read()).differences.some((x) => x.item_key === key))
        await must(me, `${root}/configuration`, body(`item:${key}`, "compared item", { action: "item", id: ids.named(`item:${s.n}:${key}`), configuration_id: configurationId, item_key: key, kind: "Identity", component, critical: false, intended_value: intended, intended_source: `${s.configuration[0]} Rev ${s.configuration[1]}`, observed_value: observed, observed_evidence: "SYN site walk-down record", observation_verified: true, proposed_as_built: observed }), `Item ${key}`);
      for (const x of (await read(reviewer)).differences.filter((i) => i.disposition === "Open")) await must(reviewer, `${root}/configuration`, body(`dispose:${x.item_key}`, "reviewed against the verified observation", { action: "dispose", item_id: x.id, expected_version: x.version, disposition: "Matches", disposition_reason: "SYN: the verified observation matches the intended value." }), `Dispose ${x.item_key}`);
      d = await read();
      if (d.configuration!.state === "Working") await must(me, `${root}/configuration`, body("configuration:submit", "comparison for review", { action: "submit", configuration_id: d.configuration!.id, expected_version: d.configuration!.version }), "Configuration submit");
    };
    const finishReconcile = async () => { d = await read(reviewer); if (d.configuration?.state === "UnderReview") await must(reviewer, `${root}/configuration`, body("configuration:reconcile", "independent reconciliation", { action: "reconcile", configuration_id: d.configuration.id, expected_version: d.configuration.version, decision_reason: "SYN: intended, observed and as-built agree for this snapshot." }), "Reconcile"); };
    const obligation = async (key: string, kind: string, title: string, stage: string, state: string | null, facts: Record<string, unknown> = {}) => {
      const oid = ids.named(`obligation:${s.n}:${key}`);
      if (!(await read()).obligations.some((o) => o.id === oid)) await must(me, `${root}/handovers`, body(`obligation:${key}`, "obligation and its required stage", { action: "obligation", id: oid, kind, title, required_stage: stage, subject: title, content_revision: "r01", source_reference: "SYN handover schedule", owner_id: owners[s.owner], due: day(s.due ?? 6) }), title);
      const o = (await read()).obligations.find((x) => x.id === oid)!;
      if (state && o.state === "Open") await must(me, `${root}/handovers`, body(`obligation:${key}:state`, "evidenced fact", { action: "obligation_state", obligation_id: oid, expected_version: o.version, state, ...facts }), `${title} ${state}`);
    };
    const release = async (included: string[] | null, excluded: Record<string, unknown>[], upTo: "Draft" | "Issued") => {
      const releaseId = ids.named(`release:${s.n}`);
      d = await read();
      if (!d.releases.some((r) => r.id === releaseId)) await must(me, `${root}/releases`, body("release:draft", "as-built release candidate", { action: "draft", id: releaseId, expected_version: d.record.version }), "Release draft");
      let r = (await read()).releases.find((x) => x.id === releaseId)!;
      if (r.state === "Draft" && r.version === 1) await must(me, `${root}/releases`, body("release:save", "exact included and excluded scope", { action: "save", release_id: releaseId, expected_version: r.version, included: included ?? s.items.map((i) => i.key), excluded, audience: "Internal", recipients: [{ destination: "Service", recipient_id: COMMISSIONING.service.id, purpose: "SYN Service support handover" }] }), "Release scope");
      if (upTo === "Draft") return releaseId;
      r = (await read()).releases.find((x) => x.id === releaseId)!;
      if (r.state === "Draft") await must(me, `${root}/releases`, body("release:submit", "candidate for review", { action: "submit", release_id: releaseId, expected_version: r.version }), "Release submit");
      r = (await read(reviewer)).releases.find((x) => x.id === releaseId)!;
      if (r.state === "InReview") await must(reviewer, `${root}/releases`, body("release:approve", "independent as-built approval", { action: "approve", release_id: releaseId, expected_version: r.version, decision_reason: "SYN: every gate reviewed against the exact candidate. Approved for issue." }), "Release approve");
      r = (await read(issuer)).releases.find((x) => x.id === releaseId)!;
      if (r.state === "ApprovedForIssue") {
        const outputId = ids.named(`output:${s.n}`);
        await must(issuer, `${root}/releases`, body("release:prepare", "exact output bytes", { action: "prepare", id: outputId, release_id: releaseId, expected_version: r.version }), "Output prepare");
        r = (await read(issuer)).releases.find((x) => x.id === releaseId)!;
        await must(issuer, `${root}/releases`, body("release:issue", "issue of the approved release", { action: "issue", release_id: releaseId, expected_version: r.version, output_id: outputId }), "Release issue");
      }
      return releaseId;
    };

    if (s.n === "001") {
      // A failed check, an owned defect, a return, a correction, and a fresh accepted retest. The failure stays in the record.
      const first = await attempt("01", [s.checks[3].key], "2026-09-17T01:30:00.000Z", COMMISSIONING.instruments.flow, null);
      await review("01", first, "Returned", "SYN: zone 4 holding pressure is below its fictional criterion. Returned for correction and a fresh retest.");
      d = await read();
      const defect = d.defects[0];
      if (defect?.state === "Open") await must(me, `${root}/results`, body("defect:correct", "correction as carried out", { action: "correct", defect_id: defect.id, expected_version: defect.version, note: "SYN: zone 4 pressure regulator reseated and its union remade. No change to the approved design." }), "Defect correction");
      await review("02", await attempt("02", [], "2026-09-19T01:00:00.000Z", COMMISSIONING.instruments.flow, first), "Accepted", "SYN: fresh retest of every check against the corrected installation. Evidence accepted.");
      await reconcile([["valve-v07", "Isolation valve V-07", "IV-050 at gridline C4", "IV-050 at gridline C4"], ["controller-channel", "Zone controller channel map", "Channels 1 to 6", "Channels 1 to 6"], ["prv-zone4", "Zone 4 pressure regulator", "PRV-25 set to SYN value", "PRV-25 set to SYN value"]]);
      d = await read(performer);
      const redlineId = ids.named("redline:001");
      if (!d.redlines.some((r) => r.id === redlineId)) await must(performer, `${root}/configuration`, body("redline", "field redline as marked up", { action: "redline", id: redlineId, expected_version: d.record.version, source_id: await publish("DrawingIssue", "H-102", "B", "Greenhouse 01 isolation schedule"), location: "Greenhouse 01", component: "Isolation valve V-07",
        description: "SYN: the installed valve is labelled V-07 on site; H-102 Rev B shows it as V-7 in the isolation schedule.", evidence: "SYN photograph reference GH01-V07-label", proposed_correction: "Update valve V-07 label in the as-built drawing." }), "Redline");
      const redline = (await read(reviewer)).redlines.find((r) => r.id === redlineId)!;
      if (redline.state === "Recorded") await must(reviewer, `${root}/configuration`, body("redline:accept", "independent redline review", { action: "redline_decide", redline_id: redlineId, expected_version: redline.version, decision: "AcceptedForIncorporation", classification: "Clerical", decision_reason: "SYN: a labelling correction with no technical effect. Accepted for incorporation into the successor of H-102.", owner_id: owners.engineer, due: day(2) }), "Redline accept");
      await obligation("manuals", "Manual", "O&M manuals and backup references", "TechnicalIssue", "Complete", { evidence: "SYN manual pack r01 checked against the installed models" });
      await obligation("training", "Training", "Operator training", "ServiceAcceptance", "EvidenceRecorded", { planned_on: "2026-09-16", delivered_on: "2026-09-18", evidence: "SYN attendance sheet OT-001, four operators" });
      d = await read();
      if (!d.inspector.next.label.includes("redline")) await must(me, root, body("check", "sources checked with the upstream adapter", { action: "check" }), "Source check");
    }
    if (s.n === "002") await attempt("01", [], "2026-09-18T02:00:00.000Z", COMMISSIONING.instruments.light, null);
    if (s.n === "003") {
      // Two failed attempts land on one defect. PG-014 was valid on the test date and is expired today: the history stands.
      const first = await attempt("01", [s.checks[0].key], "2026-09-08T01:00:00.000Z", COMMISSIONING.instruments.gauge, null);
      await review("01", first, "Returned", "SYN: duty pressure below its fictional criterion. Returned for correction and retest.");
      const second = await attempt("02", [s.checks[0].key], "2026-09-10T01:00:00.000Z", COMMISSIONING.instruments.gauge, first, [s.checks[0].key]);
      await review("02", second, "Returned", "SYN: the retest failed again. The same defect remains open; corrective work continues.");
    }
    if (s.n === "004") {
      await passAll("2026-09-15T01:00:00.000Z");
      const first = ids.named("association:004:a"), changed = ids.named("association:004:b");
      d = await read();
      if (!d.associations.length) {
        await must(me, `${root}/configuration`, body("association", "valve to channel assignment", { action: "association", id: first, expected_version: d.record.version, kind: "LogicalAssignment", from_reference: "Valve V-12", to_reference: "Controller channel 4", source: "CFG-004 Rev A channel schedule", confirmation_method: "SYN point-to-point function test", effective_from: "2026-09-15T00:00:00.000Z", affected_checks: [] }), "Association");
        const a = (await read(reviewer)).associations.find((x) => x.id === first)!;
        await must(reviewer, `${root}/configuration`, body("association:confirm", "independent confirmation", { action: "association_review", association_id: first, expected_version: a.version, decision: "Confirmed", review_note: "SYN: confirmed against the function test record.", affected_checks: [] }), "Association confirm");
      }
      // Afterwards the mapping changes upstream and on site: the earlier passing evidence needs reassessment for the checks that rested on it, and only those.
      await publish("InstalledConfiguration", "CFG-004", "B", "Valve & sensor mapping intended configuration (channel 6)", await publish("InstalledConfiguration", "CFG-004", "A", ""));
      d = await read();
      if (!d.associations.some((a) => a.id === changed)) await must(me, `${root}/configuration`, body("association:change", "changed valve to channel assignment", { action: "association", id: changed, expected_version: d.record.version, kind: "LogicalAssignment", from_reference: "Valve V-12", to_reference: "Controller channel 6", source: "CFG-004 Rev B channel schedule", effective_from: "2026-09-19T00:00:00.000Z",
        predecessor_id: first, concern: "SYN: valve V-12 was moved from channel 4 to channel 6 after the accepted test.", constraint_source: "CFG-004 Rev B: one valve per controller channel", affected_checks: [s.checks[1].key, s.checks[2].key] }), "Association change");
    }
    if (s.n === "005") {
      // Block A is complete. Block B has an owned defect and is held back by name, with its reason; the shared interface is assessed as independent.
      const a = s.checks.filter((c) => c.scope_key === "block-a").map((c) => c.key), b = s.checks.filter((c) => c.scope_key === "block-b");
      await review("01", await attempt("01", [], "2026-09-16T01:00:00.000Z", COMMISSIONING.instruments.flow, null, a), "Accepted", "SYN: Growing Block A evidence accepted.");
      await review("02", await attempt("02", [b[0].key], "2026-09-17T01:00:00.000Z", COMMISSIONING.instruments.flow, null, b.map((c) => c.key)), "Returned", "SYN: Growing Block B holding pressure failed. Returned for correction.");
      await reconcile([["blocka-manifold", "Block A manifold", "MF-A as drawn", "MF-A as drawn"]]);
      await finishReconcile();
      await release(["block-a"], [{ key: "block-b", reason: "SYN: Growing Block B has an open defect on its holding pressure and is not released.", owner_id: owners.engineer, residual: "Correct DEF-001, retest and release Block B separately." }], "Draft");
    }
    if (s.n === "006" || s.n === "007") {
      await passAll("2026-09-12T01:00:00.000Z");
      await reconcile([["controller", "Controller model and firmware", "SYN-CTL r4.2", "SYN-CTL r4.2"]]);
      await finishReconcile();
      await obligation("manuals", "Manual", "O&M manuals", "TechnicalIssue", "Complete", { evidence: "SYN manual pack r01" });
      if (s.n === "006") await obligation("training", "Training", "Operator training", "ServiceAcceptance", "Planned", { planned_on: day(6) });
      const releaseId = await release(null, [], "Issued");
      if (s.n === "007") {
        d = await read();
        const handoverId = ids.named("handover:007");
        if (!d.requests.some((r) => r.id === handoverId)) await must(me, `${root}/handovers`, body("handover:request", "Service receiving request", { action: "request", id: handoverId, submission_id: ids.named("submission:007:1"), output_id: ids.named("pack:007:1"), release_id: releaseId, expected_version: d.record.version, destination: "Service", recipient_id: COMMISSIONING.service.id, purpose: "SYN Service support handover", support_owner_id: COMMISSIONING.service.id, due: day(5) }), "Handover request");
        const r = (await read(service)).requests.find((x) => x.id === handoverId)!;
        if (r.state === "Requested") await must(service, `${root}/handovers`, body("handover:return", "the receiver's own decision", { action: "decide", handover_id: handoverId, submission_id: r.latest_submission_id, expected_version: r.latest_submission_version, outcome: "Returned", outcome_reason: "SYN: the dosing pump manual is missing from the pack. Returned for correction.", owner_id: owners.engineer, due: day(5) }), "Handover return");
      }
    }
    if (s.n === "008") {
      d = await read();
      if (!d.backups.length) await must(me, `${root}/configuration`, body("backup", "configuration backup reference", { action: "backup", id: ids.named("backup:008"), expected_version: d.record.version, asset_reference: "Irrigation controller CTL-01", purpose: "Recovery of the commissioned controller configuration", configuration_version: "SYN-CTL r4.2 / CFG-016 Rev A", native_format: "SYN controller archive",
        stored_reference: "SYN controlled store reference CTL-01/2026-09", content_hash: createHash("sha256").update("SYN fixture backup bytes").digest("hex"), captured_at: "2026-09-14T03:00:00.000Z", access_class: "Restricted", compatibility: "SYN-CTL firmware r4.x", required_stage: "TechnicalIssue" }), "Backup reference");
    }
  }
  return { package_id: pkg, records, selected: records["001"], href: `/engineering/commissioning?package=${pkg}&record=${records["001"]}` };
}
