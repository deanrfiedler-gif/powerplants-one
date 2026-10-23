import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import https from "node:https";
import { after, before, beforeEach, mock, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createClaudeAdapter } from "../../src/assistant/adapters/claude";
import { evaluationContext, evaluationEvidenceHash, evaluationHash, parseEvaluation, type EvaluationManifest } from "../../src/assistant/evaluation";
import { buildEnvelope } from "../../src/assistant/evidence";
import { runAssistantTurn, runAssistantTurns } from "../../src/assistant/turns";
import { findTurn, stopEvaluation } from "../../src/assistant/commands";
import { settleCall, monthSpend } from "../../src/assistant/budget";
import { priceFor } from "../../src/assistant/pricing";
import { activityCommand } from "../../src/activities/activities";
import { crmBase } from "../helpers/crm";
import { begin, newDeal, newProject, post, principal, profiles, rows } from "../helpers/conversations";
import { saveRaid } from "../../src/projects/raid";
import { raidInput } from "../helpers/project-raid";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic"; process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(() => {
  mock.method(globalThis, "fetch", () => { throw Error("SYN provider network forbidden"); });
  mock.method(https, "request", () => { throw Error("SYN provider network forbidden"); });
});
beforeEach(reset);
after(async () => { mock.restoreAll(); await closeDatabase(); });
const env = { PPO_ASSISTANT: "on", PPO_ENV: "local-synthetic", PPO_EXPOSURE: "loopback", PPO_IDENTITY: "synthetic", NODE_ENV: "test",
  PPO_ASSISTANT_PROVIDER: "claude", PPO_ASSISTANT_MODEL: "claude-sonnet-5-5", PPO_ANTHROPIC_API_KEY: "SYN-DUMMY-NOT-A-REAL-KEY" };
const models = ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"] as const;
async function fixture(count = 2) {
  const p = await principal(profiles.coordinator), deal = await newDeal(p), thread = await begin(p, deal);
  const turns: string[] = [], messages: string[] = [];
  for (let n = 0; n < count; n++) {
    const message = await post(p, thread, { body: "SYN @{1} What is recorded?", mentions: [{ ordinal: 1, kind: "Agent" }] });
    messages.push(message); turns.push((await rows("SELECT id FROM ppo.assistant_turns WHERE trigger_message_id=$1", [message]))[0].id);
  }
  const manifest: EvaluationManifest = { schema_version: 1, run_id: randomUUID(), workspace_id: p.workspace_id,
    source_commit: "d".repeat(40), fixture_hash: "a".repeat(64), approval_reference: "b".repeat(64), cap_micro: 5000000, calibration_cap_micro: 1650000,
    turns: await Promise.all(messages.map(async (message_id, n) => ({ message_id,
      evidence_hash: evaluationEvidenceHash(await buildEnvelope(p, { thread_id: thread, trigger_message_id: message_id })),
      model: models[Math.floor(n / 3) % 3], stage: "Calibration" as const, case_id: `C0${n % 3 + 1}`, repetition: 1 }))) };
  return { p, deal, thread, turns, messages, manifest };
}
const evaluation = (m: EvaluationManifest, stage = "Calibration") => parseEvaluation(m, evaluationHash(m), stage, stage === "Evaluation" ? "c".repeat(64) : undefined);
const payload = (model: string, extra: Record<string, unknown> = {}) => ({ id: "msg_SYN", type: "message", role: "assistant", model,
  content: [{ type: "text", text: JSON.stringify({ kind: "Answer", claims: [{ text: "SYN Recorded discovery.", source_ids: ["S1"] }], gaps: [] }) }],
  stop_reason: "end_turn", usage: { input_tokens: 1234, output_tokens: 123, inference_geo: "global", speed: "standard", service_tier: "standard", output_tokens_details: { thinking_tokens: 100 } }, ...extra });
const response = (value: unknown) => new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
const ledger = (turn: string) => rows("SELECT state,reserved_micro::int,settled_micro::int FROM ppo.assistant_budget_entries WHERE turn_id=$1 ORDER BY call_index", [turn]);

test("T2e all three SDK models persist numeric metadata, citations, immutable answers and inclusive costs", async () => {
  const f = await fixture(9);
  const message = await post(f.p, f.thread, { body: "SYN @{1} Evaluation follows calibration.", mentions: [{ ordinal: 1, kind: "Agent" }] });
  const main = (await rows("SELECT id FROM ppo.assistant_turns WHERE trigger_message_id=$1", [message]))[0].id;
  f.manifest.turns.push({ message_id: message, evidence_hash: evaluationEvidenceHash(await buildEnvelope(f.p, { thread_id: f.thread, trigger_message_id: message })),
    model: models[0], stage: "Evaluation", case_id: "L01", repetition: 1 });
  for (const [i, id] of f.turns.entries()) {
    const model = f.manifest.turns[i].model;
    const adapter = createClaudeAdapter({ env: { ...env, PPO_ASSISTANT_MODEL: model }, transport: async () => response(payload(model)) });
    assert.equal((await runAssistantTurn(id, { env, adapter, evaluation: evaluation(f.manifest) })).state, "Answered");
    assert.equal((await ledger(id))[0].settled_micro, model === models[0] ? 3698 : model === models[1] ? 185 : 7396);
    const metrics = (await rows("SELECT details->'measurement' AS m FROM ppo.audit_events WHERE object_id=$1 AND details->>'command'='Assistant:RecordCall'", [id]))[0].m;
    assert.equal(metrics.thinking_tokens, 100); assert.equal(metrics.inference_geo, "global");
    for (const table of ["audit_events", "operation_receipts", "outbox_jobs", "assistant_turns", "assistant_budget_entries"]) {
      const data = JSON.stringify(await rows(`SELECT to_jsonb(t) FROM ppo.${table} t`));
      assert.equal(data.includes("SYN Recorded discovery."), false); assert.equal(data.includes(env.PPO_ANTHROPIC_API_KEY), false);
    }
  }
  await closeDatabase();
  const adapter = createClaudeAdapter({ env, transport: async () => assert.fail("replay must not dispatch") });
  assert.equal((await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) })).state, "Answered");
  assert.equal((await findTurn(database(), main)).state, "Queued");
  let calls = 0;
  const next = createClaudeAdapter({ env, transport: async () => { calls++; return response(payload(models[0])); } });
  assert.equal(await runAssistantTurns(1, { env, adapter: next, evaluation: evaluation(f.manifest, "Evaluation") }), 1);
  assert.equal((await findTurn(database(), main)).state, "Answered"); assert.equal(calls, 1);
  const accepted = await rows("SELECT details FROM ppo.audit_events WHERE object_id=$1 AND details ? 'calibration_acceptance_hash'", [main]);
  assert.ok(accepted.length > 0); assert.ok(accepted.every(r => r.details.calibration_acceptance_hash === "c".repeat(64)));
});

test("T2e calibration cannot retry known malformed output; failed run blocks later turns", async () => {
  const f = await fixture(); let calls = 0;
  const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return response(payload(models[0], { content: [{ type: "text", text: "{" }] })); } });
  assert.deepEqual(await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) }), { state: "Failed", reason: "MalformedOutput" });
  assert.equal(calls, 1); assert.deepEqual(await ledger(f.turns[0]), [{ state: "Settled", reserved_micro: 176000, settled_micro: 3698 }]);
  assert.equal((await runAssistantTurn(f.turns[1], { env, adapter, evaluation: evaluation(f.manifest) })).state, "Unavailable");
  assert.equal(calls, 1);
  const g = await fixture(); let refusals = 0;
  const decline = createClaudeAdapter({ env, transport: async () => { refusals++; return response(payload(models[0], { stop_reason: "refusal" })); } });
  assert.deepEqual(await runAssistantTurn(g.turns[0], { env, adapter: decline, evaluation: evaluation(g.manifest) }), { state: "CannotAnswer", reason: "Declined" });
  assert.equal((await runAssistantTurn(g.turns[1], { env, adapter: decline, evaluation: evaluation(g.manifest) })).state, "Unavailable");
  assert.equal(refusals, 1); assert.equal((await ledger(g.turns[0]))[0].settled_micro, 3698);
});

test("T2e Unknown HTTP outcome stops the whole run and is never released after pool reopen", async () => {
  const f = await fixture(); let calls = 0;
  const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return new Response("{}", { status: 429 }); } });
  await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) }); await closeDatabase();
  await runAssistantTurn(f.turns[1], { env, adapter, evaluation: evaluation(f.manifest) });
  assert.equal(calls, 1); assert.deepEqual(await ledger(f.turns[0]), [{ state: "Unknown", reserved_micro: 176000, settled_micro: null }]);
  assert.equal((await ledger(f.turns[1])).length, 0);
});

test("T2e ten concurrent admission races cannot exceed the smaller run cap", async () => {
  for (let n = 0; n < 10; n++) {
    const f = await fixture(); f.manifest.cap_micro = 176000; f.manifest.calibration_cap_micro = 176000;
    let calls = 0;
    const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return response(payload(models[0])); } });
    await Promise.all(f.turns.map(id => runAssistantTurn(id, { env, adapter, evaluation: evaluation(f.manifest) })));
    assert.ok(calls <= 1); // A competing admission can stop the run before either sends; never overspend.
    const total = (await rows(`SELECT coalesce(sum(CASE WHEN state='Settled' THEN settled_micro WHEN state IN ('Reserved','Unknown') THEN reserved_micro ELSE 0 END),0)::int AS n
      FROM ppo.assistant_budget_entries WHERE turn_id=ANY($1::uuid[])`, [f.turns]))[0].n;
    assert.ok(total <= 176000);
  }
});

test("T2e manifest replacement, missing runtime configuration and an explicit persisted stop cannot resume a run", async () => {
  const f = await fixture(); let calls = 0;
  const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return response(payload(models[0])); } });
  await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) });
  const changed = { ...f.manifest, fixture_hash: "f".repeat(64) };
  await runAssistantTurn(f.turns[1], { env, adapter, evaluation: evaluation(changed) }); assert.equal(calls, 1);
  const g = await fixture();
  await runAssistantTurn(g.turns[0], { env, adapter, evaluation: evaluation(g.manifest) });
  await evaluationContext.run(evaluation(g.manifest), async () => stopEvaluation(g.p, await findTurn(database(), g.turns[0])));
  await closeDatabase(); await runAssistantTurn(g.turns[1], { env, adapter, evaluation: evaluation(g.manifest) }); assert.equal(calls, 2);
  const h = await fixture(); let reads = 0;
  const guarded = { ...env };
  Object.defineProperty(guarded, "PPO_ANTHROPIC_API_KEY", { get() { reads++; throw Error("SYN forbidden key read"); } });
  assert.equal((await runAssistantTurn(h.turns[0], { env: guarded })).state, "Unavailable"); assert.equal(reads, 0);
});

test("T2e main stage refuses without all nine settled Answered calibrations", async () => {
  const f = await fixture(2);
  f.manifest.turns[1] = { ...f.manifest.turns[1], stage: "Evaluation", case_id: "L01" };
  const adapter = createClaudeAdapter({ env, transport: async () => assert.fail("calibration gate must precede transport") });
  assert.equal((await runAssistantTurn(f.turns[1], { env, adapter, evaluation: evaluation(f.manifest, "Evaluation") })).state, "Unavailable");
  assert.equal((await ledger(f.turns[1])).length, 0);
});

test("T2e calibration sub-cap includes prior-month committed usage; a smaller cap stops before transport", async () => {
  const f = await fixture(); f.manifest.calibration_cap_micro = 200000; let calls = 0;
  const adapter = createClaudeAdapter({ env, transport: async () => {
    calls++;
    // Seed a historical ledger fixture while the original turn is Answering; this is not an SDK call.
    const old = randomUUID(), price = priceFor("Claude", models[0])!;
    await transaction(async c => {
      await c.query(`INSERT INTO ppo.assistant_budget_entries(id,workspace_id,turn_id,call_index,period,adapter,model,price_version,max_input_tokens,max_output_tokens,reserved_micro)
        VALUES($1,$2,$3,2,(date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')-interval '1 month')::date,'Claude',$4,$5,48000,8000,176000)`,
      [old, f.p.workspace_id, f.turns[0], models[0], price.version]);
      await settleCall(c, f.p.workspace_id, old, price, { input_tokens: 6000, output_tokens: 1000 });
    });
    return response(payload(models[0]));
  } });
  assert.equal((await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) })).state, "Answered");
  assert.equal((await monthSpend(database(), f.p.workspace_id)).committed, 3698);
  assert.deepEqual(await runAssistantTurn(f.turns[1], { env, adapter, evaluation: evaluation(f.manifest) }), { state: "Unavailable", reason: "BudgetSpent" });
  assert.equal(calls, 1); assert.equal((await ledger(f.turns[1])).length, 0);
  const g = await fixture(); g.manifest.calibration_cap_micro = 175999;
  assert.deepEqual(await runAssistantTurn(g.turns[0], { env, adapter, evaluation: evaluation(g.manifest) }), { state: "Unavailable", reason: "BudgetSpent" });
  assert.equal(calls, 1);
});

test("T2e missing/unsupported metadata and an underestimated request settle only representable usage and stop", async () => {
  for (const [usage, state, cost] of [
    [{ input_tokens: 1234, output_tokens: 123 }, "Settled", 3698],
    [{ input_tokens: 1234, output_tokens: 123, inference_geo: "us", speed: "standard", service_tier: "standard" }, "Unknown", null],
    [{ input_tokens: 1234, output_tokens: 123, future_billable_tokens: 1 }, "Unknown", null],
    [{ input_tokens: 48000, output_tokens: 123, inference_geo: "global", speed: "standard", service_tier: "standard" }, "Settled", 97230],
  ] as const) {
    const f = await fixture(); let calls = 0;
    const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return response(payload(models[0], { usage })); } });
    assert.deepEqual(await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) }), { state: "Failed", reason: "MalformedOutput" });
    await runAssistantTurn(f.turns[1], { env, adapter, evaluation: evaluation(f.manifest) });
    assert.equal(calls, 1); assert.deepEqual(await ledger(f.turns[0]), [{ state, reserved_micro: 176000, settled_micro: cost }]);
    assert.equal((await rows("SELECT id FROM ppo.conversation_messages WHERE turn_id=$1", [f.turns[0]])).length, 0);
  }
});

test("T2e credit exhaustion remains unavailable/Unknown; inherited TLS configuration refuses before key access", async () => {
  const f = await fixture(); let calls = 0;
  const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return new Response(JSON.stringify({ type: "error", error: {
    type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API" } }), { status: 400 }); } });
  assert.deepEqual(await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) }), { state: "Unavailable", reason: "CreditExhausted" });
  assert.deepEqual(await ledger(f.turns[0]), [{ state: "Unknown", reserved_micro: 176000, settled_micro: null }]); assert.equal(calls, 1);
  const g = await fixture(); let reads = 0;
  const blocked = { ...env, NODE_USE_SYSTEM_CA: "1" };
  Object.defineProperty(blocked, "PPO_ANTHROPIC_API_KEY", { get() { reads++; throw Error("SYN forbidden key read"); } });
  const guarded = createClaudeAdapter({ env: blocked, transport: async () => assert.fail("unsafe launch must not dispatch") });
  assert.deepEqual(await runAssistantTurn(g.turns[0], { env: blocked, adapter: guarded, evaluation: evaluation(g.manifest) }), { state: "Unavailable", reason: "ProviderUnavailable" });
  assert.equal(reads, 0); assert.deepEqual(await ledger(g.turns[0]), [{ state: "Released", reserved_micro: 176000, settled_micro: null }]);
});

test("T2e source revision or persisted stop during generation suppresses the late answer after known settlement", async () => {
  for (const stop of [false, true]) {
    const f = await fixture(); let calls = 0;
    const adapter = createClaudeAdapter({ env, transport: async () => {
      calls++;
      if (stop) await stopEvaluation(f.p, await findTurn(database(), f.turns[0]));
      else {
        const activity = (await rows("SELECT next_activity_id FROM ppo.opportunities WHERE id=$1", [f.deal]))[0].next_activity_id;
        await activityCommand(f.p, activity, { ...crmBase(), expected_version: 1, owner_id: f.p.actor_id,
          summary: "SYN revised while generating", due_at: null, due_needed: true }, "update");
      }
      return response(payload(models[0]));
    } });
    assert.deepEqual(await runAssistantTurn(f.turns[0], { env, adapter, evaluation: evaluation(f.manifest) }), { state: "Unavailable", reason: "ProviderUnavailable" });
    assert.equal(calls, 1); assert.equal((await ledger(f.turns[0]))[0].settled_micro, 3698);
    assert.equal((await rows("SELECT id FROM ppo.conversation_messages WHERE turn_id=$1", [f.turns[0]])).length, 0);
  }
});

test("T2e evidence hashes refuse unapproved content before dispatch; the worker filters selected models before its limit", async () => {
  const f = await fixture(4); let calls = 0;
  const adapter = createClaudeAdapter({ env: { ...env, PPO_ASSISTANT_MODEL: models[1] }, transport: async () => { calls++; return response(payload(models[1])); } });
  assert.equal(await runAssistantTurns(1, { env, adapter, evaluation: evaluation(f.manifest) }), 1);
  assert.equal((await findTurn(database(), f.turns[3])).state, "Answered"); assert.equal(calls, 1);
  assert.equal((await findTurn(database(), f.turns[0])).state, "Queued");
  const sonnet = createClaudeAdapter({ env, transport: async () => { calls++; return response(payload(models[0])); } });
  assert.equal(await runAssistantTurns(10, { env, adapter: sonnet, evaluation: evaluation(f.manifest) }), 1);
  assert.equal(calls, 2);
  assert.equal((await findTurn(database(), f.turns[1])).state, "Queued", "one approved turn per worker invocation, even with batch limit 10");
  const g = await fixture(); g.manifest.turns[0].evidence_hash = "f".repeat(64);
  const blocked = createClaudeAdapter({ env, transport: async () => assert.fail("unapproved evidence must not dispatch") });
  assert.deepEqual(await runAssistantTurn(g.turns[0], { env, adapter: blocked, evaluation: evaluation(g.manifest) }), { state: "Unavailable", reason: "ProviderUnavailable" });
  assert.deepEqual(await ledger(g.turns[0]), [{ state: "Released", reserved_micro: 176000, settled_micro: null }]);
});

test("T2e derived project facts changing without the project row version still suppress a stale answer", async () => {
  const p = await principal(profiles.coordinator), project = await newProject(p), thread = await begin(p, project, { anchor_type: "Project" });
  const message = await post(p, thread, { body: "SYN @{1} How many open risks are recorded?", mentions: [{ ordinal: 1, kind: "Agent" }] });
  const turn = (await rows("SELECT id FROM ppo.assistant_turns WHERE trigger_message_id=$1", [message]))[0].id;
  const version = (await rows("SELECT version FROM ppo.projects WHERE id=$1", [project]))[0].version;
  const manifest: EvaluationManifest = { schema_version: 1, run_id: randomUUID(), workspace_id: p.workspace_id,
    source_commit: "d".repeat(40), fixture_hash: "a".repeat(64), approval_reference: "b".repeat(64), cap_micro: 5000000, calibration_cap_micro: 1650000,
    turns: [{ message_id: message, evidence_hash: evaluationEvidenceHash(await buildEnvelope(p, { thread_id: thread, trigger_message_id: message })),
      model: models[0], stage: "Calibration", case_id: "C01", repetition: 1 }] };
  const adapter = createClaudeAdapter({ env, transport: async () => {
    await saveRaid(p, project, raidInput());
    assert.equal((await rows("SELECT version FROM ppo.projects WHERE id=$1", [project]))[0].version, version);
    return response(payload(models[0]));
  } });
  assert.deepEqual(await runAssistantTurn(turn, { env, adapter, evaluation: evaluation(manifest) }), { state: "Unavailable", reason: "ProviderUnavailable" });
  assert.equal((await ledger(turn))[0].settled_micro, 3698);
  assert.equal((await rows("SELECT id FROM ppo.conversation_messages WHERE turn_id=$1", [turn])).length, 0);
});
