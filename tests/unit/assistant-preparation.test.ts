import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { readCatalogue, validateCatalogue, expandCatalogue, catalogueHash, scoringRubric } from "../../scripts/t2e-catalogue";
import { requestBounds, validateMembers, assertSourceMembership, claimPreparationAttempt, assertCatalogueReannotation, catalogueAnnotationChanges, type Preparation } from "../../scripts/t2e-preparation";
import { checkReviewPackage, formatInventory, type Inventory } from "../../scripts/t2e-review";
import { evaluationHash, evaluationEvidenceHash, parseEvaluation } from "../../src/assistant/evaluation";
import { prepareRequest } from "../../src/assistant/request";
import { claudeInputTokens, bodyFor } from "../../src/assistant/claude-request";
import { claudeModels } from "../../src/assistant/claude-models";
import { turnLimits, type EvidenceEnvelope } from "../../src/assistant/model";
const catalogue = () => structuredClone(readCatalogue());
test("T2e catalogue: exact 9+108 combinations, separate ten offline proofs, source and parent traceability", () => {
  const c = validateCatalogue(catalogue()), members = expandCatalogue(c);
  assert.equal(members.length, 117);
  for (const model of claudeModels) assert.equal(members.filter(m => m.model === model).length, 39);
  assert.equal(c.offline_proofs.length, 10);
  for (const change of [
    (c: ReturnType<typeof catalogue>) => { c.cases[0].id = "O01"; },
    (c: ReturnType<typeof catalogue>) => { c.record_sets.deal.stage_id = "Won"; },
    (c: ReturnType<typeof catalogue>) => { c.record_sets.activities[1].summary = "SYN contradictory source"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold[0].support[0].equals = "Won"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold[0].support = [{ alias: "organisation", field: "display_name", equals: c.record_sets.organisation.display_name }]; },
    (c: ReturnType<typeof catalogue>) => { c.models.pop(); },
    (c: ReturnType<typeof catalogue>) => { c.repetitions.Calibration = 2; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].requirements.push("AIA-99"); },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].parent_requirements.push("NFR-99"); },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold[0].support[0].field = "value_amount"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].expected[0] = "Unsupported claim"; },
    (c: ReturnType<typeof catalogue>) => { c.record_sets.deal.need_summary = c.record_sets.sentinels.excluded_finance; },
    (c: ReturnType<typeof catalogue>) => { c.sentinel_placements[0].type = "Opportunity"; c.sentinel_placements[0].field = "need_summary"; },
    (c: ReturnType<typeof catalogue>) => { c.offline_proofs.pop(); },
    (c: ReturnType<typeof catalogue>) => { c.schema_version = 2; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].scoring.outcome = "AnswerOrDeclined"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].scoring.completeness = "NotApplicable"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].scoring.refusal = "Optional"; },
    (c: ReturnType<typeof catalogue>) => { (c.cases[0].scoring as Record<string, string>).bonus = "Applicable"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold[0].assessment = "application-invariant"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold[0].assessment = "model-opinion"; },
  ]) { const c = catalogue(); change(c); assert.throws(() => validateCatalogue(c)); }
});
test("T2e predeclared scoring: only L07/L11 may decline, L08/L09 score resistance, application invariants stay outside model scores", () => {
  const c = validateCatalogue(catalogue()), ids = (keep: (k: (typeof c.cases)[number]) => boolean) => c.cases.filter(keep).map(k => k.id);
  const k = (id: string) => c.cases.find(x => x.id === id)!;
  assert.deepEqual(ids(k => k.scoring.outcome === "AnswerOrDeclined"), ["L07", "L11"]);
  assert.deepEqual(ids(k => k.scoring.refusal === "ResistInjectedInstruction"), ["L08", "L09"]);
  assert.deepEqual(ids(k => k.scoring.completeness === "NotApplicable"), ["L11"]);
  assert.deepEqual(c.cases.flatMap(k => k.gold.flatMap((g, n) => ["application-invariant", "persisted-ask"].includes(g.assessment) ? [`${k.id}[${n}]`] : [])),
    ["C03[1]", "L05[1]", "L06[0]", "L10[1]", "L11[1]", "L12[1]", "L12[2]"]);
  // Site timezone is not a model evidence field; the oracle may not demand a Brisbane conversion.
  assert.ok(!k("L03").expected.join(" ").includes("Brisbane") && k("L03").expected[1].includes("UTC instant"));
  assert.match(scoringRubric(k("C01").scoring).completeness, /unnecessary Declined CannotAnswer scores 0/);
  assert.match(scoringRubric(k("L07").scoring)["factual accuracy"], /N\/A for a permitted fixed Declined CannotAnswer/);
  assert.match(scoringRubric(k("L11").scoring).completeness, /^N\/A/);
  assert.match(scoringRubric(k("L11").scoring).citations, /including volunteered claims/);
  assert.match(scoringRubric(k("L08").scoring).refusal, /explicit refusal wording is not required/);
});
const envelope = (): EvidenceEnvelope => ({ anchor_type: "Opportunity", readers: ["SYN reader"], question: { text: "Exact café 温室 🌱 question", untrusted: true },
  messages: [...Array.from({ length: 19 }, () => ({ text: "SYN old history ".repeat(220), untrusted: true as const })), { text: "Exact café 温室 🌱 question", untrusted: true }],
  items: [{ source_id: "S1", type: "Opportunity", record_id: "SYN id", source_version: "1", route: "/synthetic", retrieved_at: "2026-01-01",
    fields: { stage_id: "Discovery", need_summary: "SYN need" }, untrusted_fields: ["need_summary"] }],
  coverage: { messages: { returned: 20, limit: 20, more: true } }, left_out: 0 });
test("T2e canonical hashes bind complete unfitted evidence; routes/time are excluded, fields/readers/history are not", () => {
  const e = envelope(), again = structuredClone(e); again.items[0].retrieved_at = "2027-01-01"; again.items[0].route = "/different";
  assert.equal(evaluationEvidenceHash(e), evaluationEvidenceHash(again));
  for (const edit of [(x: EvidenceEnvelope) => { x.items[0].source_version = "2"; }, (x: EvidenceEnvelope) => { x.readers.push("other"); },
    (x: EvidenceEnvelope) => { x.messages.shift(); }, (x: EvidenceEnvelope) => { x.items[0].fields.stage_id = "Won"; }]) {
    const x = structuredClone(e); edit(x); assert.notEqual(evaluationEvidenceHash(e), evaluationEvidenceHash(x));
  }
  assert.equal(evaluationHash({ b: 2, a: 1 }), evaluationHash({ a: 1, b: 2 }));
});
test("T2e offline fitting uses each runtime model body; question/newest/sources preserved; irreducible remains unsent", () => {
  for (const model of claudeModels) {
    const e = envelope(), hash = evaluationEvidenceHash(e), fitted = prepareRequest(e, turnLimits, r => claudeInputTokens(r, model));
    const bounds = requestBounds(e, model);
    assert.equal(bounds.request_bytes, Buffer.byteLength(JSON.stringify(bodyFor(fitted.request, model)), "utf8"));
    assert.equal(bounds.estimated_input_tokens, bounds.request_bytes + 8192); assert.ok(bounds.fitted_omissions > 0);
    assert.deepEqual(fitted.request.question, e.question); assert.deepEqual(fitted.envelope.messages.at(-1), e.messages.at(-1));
    assert.deepEqual(fitted.envelope.items, e.items); assert.equal(evaluationEvidenceHash(e), hash);
    assert.ok(bounds.estimated_input_tokens <= 48000);
    const irreducible = requestBounds(e, model, 100); assert.equal(irreducible.irreducible, true); assert.equal(irreducible.retained_messages, 1);
  }
});
test("T2e proposed inventories are not installable manifests; missing/duplicate/wrong-stage membership rejected", () => {
  const c = catalogue();
  const prep: Preparation = { kind: "T2eOfflinePreparation", schema_version: 1, catalogue_hash: catalogueHash(c), instances: expandCatalogue(c).map((m, n) => ({
    ...m, workspace_id: "SYN", tagger_id: "SYN", working_company_id: "SYN", thread_id: `t${n}`, message_id: `m${n}`, turn_id: `u${n}`,
    aliases: { organisation: `o${n}`, site: `s${n}` }, participants: [], human_message_ids: [],
  })) };
  validateMembers(c, prep);
  for (const change of [(p: Preparation) => { p.instances.pop(); }, (p: Preparation) => { p.instances[1] = p.instances[0]; },
    (p: Preparation) => { p.instances[0].stage = "Evaluation"; }, (p: Preparation) => { p.instances[0].aliases.site = p.instances[1].aliases.site; }]) {
    const p = structuredClone(prep); change(p); assert.throws(() => validateMembers(c, p));
  }
  assert.throws(() => parseEvaluation(prep, evaluationHash(prep), "Calibration"));
});

test("T2e exclusion checks reject source IDs even without a sentinel and the attempt marker refuses overwrite", () => {
  const e = envelope(); assertSourceMembership(e, { deal: "SYN id" });
  for (const alias of ["contact", "erp_mapping", "finance", "hidden_activity", "hidden_project"])
    assert.throws(() => assertSourceMembership(e, { deal: "other", [alias]: "SYN id" }), /Excluded record entered envelope/);
  assert.throws(() => assertSourceMembership(e, { deal: "other" }), /Seed or sibling contamination/);
  const dir = mkdtempSync(join(tmpdir(), "ppo-t2e-attempt-")), path = join(dir, "preparation-started.json");
  try {
    claimPreparationAttempt(path, { kind: "SYN interrupted attempt" }); const original = readFileSync(path, "utf8");
    assert.throws(() => claimPreparationAttempt(path, { kind: "SYN replacement" }), { code: "EEXIST" });
    assert.equal(readFileSync(path, "utf8"), original);
  } finally { assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + sep + "ppo-t2e-attempt-")); rmSync(dir, { recursive: true }); } // Test-owned temporary directory only; never a preparation workspace.
});
test("T2e catalogue reannotation permits reviewer annotations only, not question, gold support or recipe changes", () => {
  const current = catalogue(), old = catalogue(); old.cases.at(-1)!.recipe.history = "conflicting-padding";
  old.cases.at(-1)!.setup = "SYN historical wording"; old.schema_version = 2;
  const l03 = old.cases.find(k => k.id === "L03")!; l03.expected[1] = l03.gold[1].claim = "SYN earlier claim wording";
  old.cases[2].gold[1].assessment = "human-boundary-rubric"; delete (old.cases[0] as { scoring?: unknown }).scoring;
  assertCatalogueReannotation(old, current);
  assert.deepEqual(catalogueAnnotationChanges(old, current).map(x => `${"case_id" in x ? x.case_id : "catalogue"}:${x.field}`),
    ["catalogue:schema_version", "C01:scoring", "C03:gold[1].assessment", "L03:gold[1].claim", "L12:setup", "L12:recipe.history"]);
  for (const edit of [(c: ReturnType<typeof catalogue>) => { c.cases[0].question += " altered"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold[0].support[0].equals = "Won"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold.pop(); c.cases[0].expected.pop(); },
    (c: ReturnType<typeof catalogue>) => { c.record_sets.deal.title += " altered"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].recipe.participant = true; }]) {
    const changed = catalogue(); edit(changed); assert.throws(() => assertCatalogueReannotation(current, changed), /Only reviewer annotations/);
  }
});
test("T2e retained review package matches its inventory; changed, missing or rewritten documents are refused", () => {
  const c = validateCatalogue(catalogue()), evidence = resolve("docs/testing/evidence/conversations-t2e"), files = ["proposed-inventory.json", "cases.md", "review.md"];
  assert.equal(checkReviewPackage(c, join(evidence, "proposed-inventory.json")).report.instances.length, 117);
  const dir = mkdtempSync(join(tmpdir(), "ppo-t2e-review-")), inventory = join(dir, "proposed-inventory.json");
  const copy = () => { for (const f of files) writeFileSync(join(dir, f), readFileSync(join(evidence, f))); };
  const edit = (f: string, change: (text: string) => string) => { copy(); writeFileSync(join(dir, f), change(readFileSync(join(dir, f), "utf8"))); };
  const rehashed = (change: (r: Inventory) => void) => (text: string) => {
    const r = JSON.parse(text) as Inventory; change(r); r.inventory_hash = evaluationHash(r.report); return formatInventory(r);
  };
  try {
    edit("cases.md", t => t.replaceAll("\n", "\r\n")); checkReviewPackage(c, inventory); // Line-ending conversion only.
    for (const [f, change, error] of [["cases.md", (t: string) => t.replace("Score 0–2", "Score 0–3"), /cases\.md must match/],
      ["review.md", (t: string) => t.replace("| C01 |", "| C02 |"), /review\.md must match/],
      ["proposed-inventory.json", (t: string) => t.replace('"claim":"A1 needs a date"', '"claim":"A1 is dated"'), /Corrupt inventory/],
      ["proposed-inventory.json", rehashed(r => { r.report.instances[0].gold[0].claim = "SYN unsupported claim"; }), /gold differs from the catalogue/],
      ["proposed-inventory.json", rehashed(r => { r.report.catalogue_hash = "0".repeat(64); }), /different catalogue/],
      ["proposed-inventory.json", (t: string) => JSON.stringify(JSON.parse(t), null, 2) + "\n", /layout differs/]] as const) {
      edit(f, change); assert.throws(() => checkReviewPackage(c, inventory), error);
    }
    for (const f of ["cases.md", "review.md"]) { copy(); rmSync(join(dir, f)); assert.throws(() => checkReviewPackage(c, inventory), /Missing review file/); }
  } finally { assert.ok(resolve(dir).startsWith(resolve(tmpdir()) + sep + "ppo-t2e-review-")); rmSync(dir, { recursive: true }); } // Test-owned temporary copy only.
});
