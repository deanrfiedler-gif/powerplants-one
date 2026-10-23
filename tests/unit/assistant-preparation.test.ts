import assert from "node:assert/strict";
import { test } from "node:test";
import { readCatalogue, validateCatalogue, expandCatalogue, catalogueHash } from "../../scripts/t2e-catalogue";
import { requestBounds, validateMembers, type Preparation } from "../../scripts/t2e-preparation";
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
    (c: ReturnType<typeof catalogue>) => { c.models.pop(); },
    (c: ReturnType<typeof catalogue>) => { c.repetitions.Calibration = 2; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].requirements.push("AIA-99"); },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].parent_requirements.push("NFR-99"); },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].gold[0].support[0].field = "value_amount"; },
    (c: ReturnType<typeof catalogue>) => { c.cases[0].expected[0] = "Unsupported claim"; },
    (c: ReturnType<typeof catalogue>) => { c.record_sets.deal.need_summary = c.record_sets.sentinels.excluded_finance; },
    (c: ReturnType<typeof catalogue>) => { c.sentinel_placements[0].type = "Opportunity"; c.sentinel_placements[0].field = "need_summary"; },
    (c: ReturnType<typeof catalogue>) => { c.offline_proofs.pop(); },
  ]) { const c = catalogue(); change(c); assert.throws(() => validateCatalogue(c)); }
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
