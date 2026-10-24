import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, unlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadCatalogue, validateCatalogue, matrix, inspectEnvelope, digest, goldMappings, rubricFor } from "../../scripts/assistant-evaluation-catalogue";
import type { EvidenceEnvelope } from "../../src/assistant/model";
import { checkReviewSnapshot, checkReviewArtifacts, caseCards, reviewTable, type ReviewSnapshot } from "../../scripts/assistant-evaluation-prepare";
const sources = ["docs/decisions/conversations-t2-scope.md", "docs/blueprints/ppo-assistant-specification.md"].map(p => readFileSync(p, "utf8"));
test("T2e catalogue has exact 9 calibration / 108 evaluation matrix and real requirement IDs", () => {
  const c = loadCatalogue(), m = matrix(c);
  assert.equal(m.filter(x => x.stage === "Calibration").length, 9);
  assert.equal(m.filter(x => x.stage === "Evaluation").length, 108);
  assert.equal(new Set(m.map(x => JSON.stringify(x))).size, 117);
  for (const mutate of [
    () => { c.cases[0].requirements.push("AIA-99"); },
    () => { c.cases[0].id = "L01"; },
    () => { c.cases[0].stage = "Evaluation"; },
    () => { c.cases[0].question += c.record_sets.sentinels.excluded_email; },
  ]) {
    const original = structuredClone(c); mutate();
    assert.throws(() => validateCatalogue(c, sources)); Object.assign(c, original);
  }
});
test("T2e review does not demand withheld timezone or credit fixed application behavior as model quality", () => {
  const c = loadCatalogue();
  const saved = JSON.parse(readFileSync("docs/testing/evidence/conversations-t2e/preparation-review/inventory.json", "utf8"));
  const instances = saved.instances.map((i: ReviewSnapshot["instances"][number]) => ({ ...i,
    gold: goldMappings(c.cases.find(item => item.id === i.case_id)!, i.envelope, i.aliases), rubric: rubricFor(i.case_id) }));
  const date = instances.find((i: ReviewSnapshot["instances"][number]) => i.case_id === "L03");
  assert.ok(!JSON.stringify(date.envelope).includes("Brisbane"), "the actual retained request does not supply the site timezone");
  assert.equal(date.gold[1].bindings[0].fields.summary, c.record_sets.activities[1].summary);
  assert.match(date.gold[1].bindings[1].rule, /Do not require Brisbane conversion/);
  for (const [id, index] of [["C03", 1], ["L05", 1], ["L06", 0], ["L10", 1], ["L11", 1], ["L12", 1], ["L12", 2]] as const)
    assert.match(instances.find((i: ReviewSnapshot["instances"][number]) => i.case_id === id).gold[index].assessment, /^Application invariant/);
  assert.match(rubricFor("L11").factual_accuracy, /every factual Answer/);
  assert.match(rubricFor("L11").citations, /including L11/);
  assert.match(rubricFor("L07").omissions_uncertainty, /N\/A for permitted fixed Declined/);
  assert.match(rubricFor("L01").completeness, /0 for an unnecessary Declined/);
  assert.match(rubricFor("L09").refusal, /explicit refusal wording is not required/);
  const cards = caseCards({ ...saved, instances });
  assert.equal((cards.match(/^## [CL]\d+/gm) ?? []).length, 15);
  assert.ok(cards.includes(date.gold[1].bindings[1].rule));
  assert.ok(cards.includes(rubricFor("L11").citations));
});
test("T2e inspection rejects source contamination, leaked sentinels, changed facts and request identity", () => {
  const c = loadCatalogue(), item = c.cases[0], aliases = { anchor: "SYN-INTERNAL-IDENTITY" };
  const envelope: EvidenceEnvelope = { anchor_type: "Opportunity", readers: ["SYN-READER"], question: { text: item.question, untrusted: true },
    messages: [{ text: item.question, untrusted: true }], coverage: {}, left_out: 0,
    items: [{ source_id: "S1", type: "Opportunity", record_id: aliases.anchor, source_version: "1", retrieved_at: "2026-10-24T00:00:00Z",
      route: "/sales/opportunities/SYN-INTERNAL-IDENTITY", fields: { stage_id: "Discovery", close_outcome: "Open", expected_close_date: null }, untrusted_fields: [] }] };
  assert.ok(inspectEnvelope(c, item, envelope, aliases).estimated_input_tokens < 48000);
  for (const mutate of [
    (e: EvidenceEnvelope) => { e.items[0].record_id = "unknown"; },
    (e: EvidenceEnvelope) => { e.items[0].fields.stage_id = "Won"; },
    (e: EvidenceEnvelope) => { e.items[0].fields.title = c.record_sets.sentinels.excluded_finance; },
    (e: EvidenceEnvelope) => { e.messages[0].text = aliases.anchor; },
  ]) {
    const copy = structuredClone(envelope); mutate(copy);
    assert.throws(() => inspectEnvelope(c, item, copy, aliases));
  }
  assert.notEqual(digest(envelope), digest({ ...envelope, left_out: 1 }));
});
test("T2e review hash binds preparation metadata as well as canonical inventory content", () => {
  const current = { schema_version: 1, kind: "T2eReviewInventory", status: "Proposed; no live authority",
    catalogue_hash: "a".repeat(64), corpus_hash: "b".repeat(64), preparation_sources: {}, instances: [] };
  const content = { ...current, preparation_commit: "c".repeat(40), tracked_changes_at_preparation: [] as string[] };
  const saved = { ...content, inventory_hash: digest(content) };
  assert.doesNotThrow(() => checkReviewSnapshot(current, saved));
  for (const changed of [
    { ...saved, preparation_commit: "d".repeat(40) },
    { ...saved, tracked_changes_at_preparation: ["SYN-changed.ts"] },
    { ...saved, status: "Approved" },
    { ...saved, inventory_hash: "e".repeat(64) },
  ]) assert.throws(() => checkReviewSnapshot(current, changed));
});


test("T2e verification rejects changed or missing human review files", () => {
  const saved: ReviewSnapshot = JSON.parse(readFileSync("docs/testing/evidence/conversations-t2e/scoring-review/inventory.json", "utf8"));
  const folder = mkdtempSync(join(tmpdir(), "ppo-t2e-review-artifacts-"));
  try {
    const files = { "cases.md": caseCards(saved), "review.md": reviewTable(saved) };
    for (const [name, contents] of Object.entries(files)) writeFileSync(join(folder, name), contents);
    assert.doesNotThrow(() => checkReviewArtifacts(folder, saved));
    for (const [name, contents] of Object.entries(files)) {
      writeFileSync(join(folder, name), contents + "\nSYN tampered approval\n");
      assert.throws(() => checkReviewArtifacts(folder, saved), /must match the retained inventory/);
      unlinkSync(join(folder, name));
      assert.throws(() => checkReviewArtifacts(folder, saved), /ENOENT/);
      writeFileSync(join(folder, name), contents.replaceAll("\n", "\r\n"));
      assert.doesNotThrow(() => checkReviewArtifacts(folder, saved), "Git CRLF checkout conversion is harmless");
    }
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
