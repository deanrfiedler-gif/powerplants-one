import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { loadCatalogue, validateCatalogue, matrix, inspectEnvelope, digest } from "../../scripts/assistant-evaluation-catalogue";
import type { EvidenceEnvelope } from "../../src/assistant/model";
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
