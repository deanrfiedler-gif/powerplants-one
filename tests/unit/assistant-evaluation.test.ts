import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import https from "node:https";
import { after, before, mock, test } from "node:test";
import { createClaudeAdapter } from "../../src/assistant/adapters/claude";
import { parseEvaluation, evaluationHash, loadEvaluation } from "../../src/assistant/evaluation";
import { safeMeasurement } from "../../src/assistant/measurements";
import { priceFor, costMicro } from "../../src/assistant/pricing";
import type { AdapterRequest } from "../../src/assistant/model";

before(() => {
  mock.method(globalThis, "fetch", () => { throw Error("SYN network forbidden"); });
  mock.method(https, "request", () => { throw Error("SYN network forbidden"); });
});
after(() => mock.restoreAll());
const models = ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"];
const env = { PPO_ASSISTANT: "on", PPO_ENV: "local-synthetic", PPO_EXPOSURE: "loopback", PPO_IDENTITY: "synthetic", NODE_ENV: "test", PPO_ASSISTANT_PROVIDER: "claude", PPO_ANTHROPIC_API_KEY: "SYN-DUMMY-NOT-A-REAL-KEY" };
const request: AdapterRequest = { question: { text: "SYN What is recorded?", untrusted: true }, envelope: {
  anchor_type: "Opportunity", messages: [], coverage: {}, left_out: 0,
  items: [{ source_id: "S1", fields: { title: "SYN Discovery" }, untrusted_fields: ["title"] }],
}, allowance: { input_tokens: 48000, output_tokens: 8000 } };
const answer = { kind: "Answer", claims: [{ text: "SYN Discovery", source_ids: ["S1"] }], gaps: [] };
const raw = (model: string, extra: Record<string, unknown> = {}) => ({ model, type: "message", role: "assistant", id: "msg_SYN",
  content: [{ type: "text", text: JSON.stringify(answer) }], stop_reason: "end_turn",
  usage: { input_tokens: 1234, output_tokens: 123, output_tokens_details: { thinking_tokens: 100 }, inference_geo: "global", speed: "standard", service_tier: "standard" }, ...extra });

test("T2e model-specific SDK requests, inclusive reasoning, prices and sanitised measurements", async () => {
  for (const [index, model] of models.entries()) {
    let wire = "";
    const adapter = createClaudeAdapter({ env: { ...env, PPO_ASSISTANT_MODEL: model }, transport: async (_url, init) => {
      wire = String(init.body); const body = JSON.parse(wire);
      assert.equal(body.model, model); assert.equal(body.speed, undefined); assert.equal(body.tools, undefined);
      assert.deepEqual(body.thinking, index === 0 ? { type: "between_tools" } : { type: "adaptive", display: "omitted" });
      return new Response(JSON.stringify(raw(model, index === 0 ? {} : { content: [
        { type: "thinking", thinking: "SYN NEVER RETAIN REASONING", signature: "SYN signature" },
        { type: "text", text: JSON.stringify(answer) },
      ] })), { headers: { "content-type": "application/json" } });
    } });
    const result = await adapter.answer(request, new AbortController().signal);
    assert.equal(result.kind, "Answer"); assert.equal(result.usage.output_tokens, 123);
    assert.equal(result.measurement?.thinking_tokens, 100);
    assert.equal(result.measurement?.request_bytes, Buffer.byteLength(wire));
    assert.equal(result.measurement?.estimated_input_tokens, Buffer.byteLength(wire) + 8192);
    assert.equal(JSON.stringify(result).includes("NEVER RETAIN"), false);
    assert.equal(costMicro(priceFor("Claude", model)!, result.usage), [3698, 185, 7396][index]);
  }
});

test("T2e both documented refusal discriminators discard all partial content and retain known usage", async () => {
  for (const fields of [{ stop_reason: "refusal" }, { stop_details: { type: "refusal", explanation: "SYN raw refusal" } }]) {
    const adapter = createClaudeAdapter({ env: { ...env, PPO_ASSISTANT_MODEL: models[0] }, transport: async () =>
      new Response(JSON.stringify(raw(models[0], fields)), { headers: { "content-type": "application/json" } }) });
    const result = await adapter.answer(request, new AbortController().signal);
    assert.equal(result.kind, "Decline"); assert.equal(JSON.stringify(result).includes("SYN raw refusal"), false);
  }
});

test("T2e manifest rejects unknown fields, duplicate messages, inflated caps and hash changes", () => {
  const manifest = { schema_version: 1, run_id: "10000000-0000-4000-8000-000000000099", workspace_id: "10000000-0000-4000-8000-000000000001",
    source_commit: "d".repeat(40), fixture_hash: "a".repeat(64), approval_reference: "b".repeat(64), cap_micro: 5000000, calibration_cap_micro: 1650000,
    turns: [{ message_id: "10000000-0000-4000-8000-000000000002", evidence_hash: "e".repeat(64), model: models[0], stage: "Calibration", case_id: "C01", repetition: 1 }] };
  const hash = evaluationHash(manifest);
  assert.equal(hash.length, 64); assert.ok(parseEvaluation(manifest, hash, "Calibration"));
  for (const value of [{ ...manifest, raw_prompt: "SYN" }, { ...manifest, turns: [...manifest.turns, ...manifest.turns] },
    { ...manifest, cap_micro: 5000001 }, { ...manifest, calibration_cap_micro: 1650001 }])
    assert.throws(() => parseEvaluation(value, evaluationHash(value), "Calibration"));
  assert.throws(() => parseEvaluation(manifest, createHash("sha256").update("changed").digest("hex"), "Calibration"));
  assert.throws(() => parseEvaluation(manifest, hash, "Evaluation"));
});

test("T2e runtime requires a bounded JSON manifest bound to a clean exact commit", () => {
  const parent = process.cwd(), root = resolve("tmp/t2e/manifest-tests");
  mkdirSync(root, { recursive: true });
  const dir = mkdtempSync(`${root}/run-`), path = `${dir}/run.json`;
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init"); writeFileSync(`${dir}/source.txt`, "SYN source\n"); git("add", "source.txt");
  git("-c", "user.name=SYN Test", "-c", "user.email=syn@example.invalid", "-c", "commit.gpgsign=false", "commit", "-m", "SYN initial");
  const manifest = { schema_version: 1, run_id: "10000000-0000-4000-8000-000000000099", workspace_id: "10000000-0000-4000-8000-000000000001",
    source_commit: git("rev-parse", "HEAD"), fixture_hash: "a".repeat(64), approval_reference: "b".repeat(64), cap_micro: 5000000, calibration_cap_micro: 1650000,
    turns: [{ message_id: "10000000-0000-4000-8000-000000000002", evidence_hash: "e".repeat(64), model: models[0], stage: "Calibration", case_id: "C01", repetition: 1 }] };
  writeFileSync(path, JSON.stringify(manifest));
  const configured = { ...env, PPO_ASSISTANT_EVALUATION_MANIFEST: path, PPO_ASSISTANT_EVALUATION_HASH: evaluationHash(manifest), PPO_ASSISTANT_EVALUATION_STAGE: "Calibration" };
  // Every byte belongs to this test; no real environment or credential file is opened.
  try {
    process.chdir(dir); assert.equal(loadEvaluation(configured)?.manifest.source_commit, manifest.source_commit);
    writeFileSync(`${dir}/source.txt`, "SYN changed\n"); assert.throws(() => loadEvaluation(configured));
    writeFileSync(`${dir}/source.txt`, "SYN source\n");
    const changed = { ...manifest, source_commit: "d".repeat(40) }; writeFileSync(path, JSON.stringify(changed));
    assert.throws(() => loadEvaluation({ ...configured, PPO_ASSISTANT_EVALUATION_HASH: evaluationHash(changed) }));
    writeFileSync(path, " ".repeat(64001)); assert.throws(() => loadEvaluation(configured));
    assert.throws(() => loadEvaluation({ ...configured, PPO_ASSISTANT_EVALUATION_MANIFEST: `${dir}/SYN-not-an-environment-file.env` }));
  } finally { process.chdir(parent); }
});

test("T2e persistence projection drops arbitrary provider text and rejects invalid measurements", () => {
  const fields = { request_bytes: 10, estimated_input_tokens: 8202, duration_ms: 100, inference_geo: "global", speed: "standard",
    service_tier: "standard", thinking_tokens: 5, unsupported_usage: false };
  assert.deepEqual(safeMeasurement({ ...fields, provider_error: "SYN raw payload", signature: "SYN signature" }), fields);
  for (const extra of [{ duration_ms: -1 }, { inference_geo: "SYN arbitrary provider text" }, { thinking_tokens: NaN }, { unsupported_usage: "false" }])
    assert.equal(safeMeasurement({ ...fields, ...extra }), undefined);
});
