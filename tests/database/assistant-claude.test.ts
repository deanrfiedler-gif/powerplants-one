import assert from "node:assert/strict";
import https from "node:https";
import { getCACertificates } from "node:tls";
import { EventEmitter } from "node:events";
import type { IncomingMessage } from "node:http";
import { after, before, beforeEach, mock, test } from "node:test";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database, transaction } from "../../src/platform/database";
import { postMessage } from "../../src/conversations/commands";
import { readThread } from "../../src/conversations/reads";
import { createClaudeAdapter, claudeModel } from "../../src/assistant/adapters/claude";
import { runAssistantTurn, runAssistantTurns } from "../../src/assistant/turns";
import { begin, code, messageInput, newDeal, person, post, principal, profiles, rows } from "../helpers/conversations";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(() => {
  mock.method(globalThis, "fetch", () => { throw Error("SYN provider network forbidden"); });
  mock.method(https, "request", () => { throw Error("SYN provider network forbidden"); });
});
beforeEach(reset);
after(async () => { mock.restoreAll(); await closeDatabase(); });
const env = { PPO_ASSISTANT: "on", PPO_ENV: "local-synthetic", PPO_EXPOSURE: "loopback", PPO_IDENTITY: "synthetic",
  NODE_ENV: "test", PPO_ASSISTANT_PROVIDER: "claude", PPO_ASSISTANT_MODEL: claudeModel, PPO_ANTHROPIC_API_KEY: "SYN-DUMMY-NOT-A-REAL-KEY" };
const usage = { input_tokens: 1234, output_tokens: 123 };
const claim = "SYN The deal is in discovery.";
const answer = { kind: "Answer", claims: [{ text: claim, source_ids: ["S1"] }], gaps: ["SYN Delivery timing is unknown."] };
const response = (extra: Record<string, unknown> = {}) => new Response(JSON.stringify({
  id: "msg_SYN", type: "message", role: "assistant", model: claudeModel,
  content: [{ type: "text", text: JSON.stringify(answer) }], stop_reason: "end_turn", usage, ...extra,
}), { headers: { "content-type": "application/json" } });
const ledger = (id: string) => rows("SELECT state,call_index,reserved_micro::int,settled_micro::int,input_tokens,output_tokens FROM ppo.assistant_budget_entries WHERE turn_id=$1 ORDER BY call_index", [id]);
const messages = (id: string) => rows("SELECT id,body,adapter,author_id,acted_for_id FROM ppo.conversation_messages WHERE turn_id=$1", [id]);
async function fixture() {
  const p = await principal(profiles.coordinator), other = await principal(profiles.dealReader);
  const deal = await newDeal(p), thread = await begin(p, deal);
  const input = messageInput({ body: "SYN @{1} @{2} what is recorded?", mentions: [{ ordinal: 1, kind: "Agent" }, person(other.actor_id, 2)],
    asks: [{ ordinal: 2, question: "SYN Confirm the delivery timing?" }] });
  const posted = await postMessage(p, thread, input);
  const turn = (await rows("SELECT id FROM ppo.assistant_turns WHERE trigger_message_id=$1", [posted.receipt.record_id]))[0].id as string;
  return { p, other, deal, thread, input, posted, turn };
}

test("T2d persisted service → queue → actual SDK/worker → immutable cited answer and ledger; replay/reload/concurrency", async () => {
  const f = await fixture(); let calls = 0;
  const adapter = createClaudeAdapter({ env, transport: async (url, init) => {
    calls++;
    assert.equal(url, "https://api.anthropic.com/v1/messages");
    assert.deepEqual((await ledger(f.turn)).map(e => [e.state, e.reserved_micro]), [["Reserved", 176000]]);
    const wire = String(init.body);
    for (const excluded of [f.p.actor_id, f.other.actor_id, f.deal, f.thread, '"record_id"', '"route"', '"readers"', '"value_amount"', '"email"'])
      assert.equal(wire.includes(excluded), false, excluded);
    await transaction(async c => { await c.query("SET LOCAL lock_timeout='1s'"); await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [f.p.workspace_id]); });
    return response();
  } });
  await Promise.all([runAssistantTurns(10, { env, adapter }), runAssistantTurns(10, { env, adapter })]);
  assert.equal(calls, 1);
  const stored = await messages(f.turn); assert.equal(stored.length, 1);
  assert.equal(stored[0].adapter, "Claude"); assert.equal(stored[0].author_id, null); assert.equal(stored[0].acted_for_id, f.p.actor_id);
  assert.match(stored[0].body, /SYN The deal is in discovery\. \[1\]/);
  assert.deepEqual((await ledger(f.turn)).map(e => [e.state, e.settled_micro, e.input_tokens, e.output_tokens]), [["Settled", 3698, 1234, 123]]);
  const view = await readThread(f.p, f.thread), agent = view.messages.find(m => m.id === stored[0].id)!;
  assert.ok("agent" in agent && agent.agent?.label === "Claude" && agent.agent.sources[0].can_open);
  assert.equal(view.asks[0].state, "Open");
  const replay = await postMessage(f.p, f.thread, f.input); assert.equal(replay.receipt.record_id, f.posted.receipt.record_id);
  await closeDatabase(); // Reopen the pool to prove reload reads persisted state, not adapter memory.
  await runAssistantTurns(10, { env, adapter }); await runAssistantTurn(f.turn, { env, adapter });
  assert.equal(calls, 1); assert.equal((await messages(f.turn)).length, 1);
  for (const sql of ["UPDATE ppo.conversation_messages SET body='SYN mutation' WHERE id=$1", "DELETE FROM ppo.conversation_messages WHERE id=$1"])
    await assert.rejects(database().query(sql, [stored[0].id]), code("55000"));
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs", "assistant_turns", "assistant_budget_entries"]) {
    const data = JSON.stringify(await rows(`SELECT to_jsonb(t) AS data FROM ppo.${table} t`));
    for (const secret of [f.input.body, claim, "SYN Delivery timing is unknown.", env.PPO_ANTHROPIC_API_KEY, "msg_SYN"])
      assert.equal(data.includes(secret), false, table);
  }
});

test("T2d known malformed responses reserve anew per actual SDK request and settle each, then stop", async () => {
  const f = await fixture(); let calls = 0;
  const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return response({ content: [{ type: "text", text: "{" }] }); } });
  assert.deepEqual(await runAssistantTurn(f.turn, { env, adapter }), { state: "Failed", reason: "MalformedOutput" });
  assert.equal(calls, 3);
  const entries = await ledger(f.turn);
  assert.deepEqual(entries.map(e => [e.call_index, e.state, e.settled_micro]), [[1, "Settled", 3698], [2, "Settled", 3698], [3, "Settled", 3698]]);
  assert.deepEqual(entries.map(e => e.reserved_micro), [176000, 172302, 168604]);
  assert.equal((await messages(f.turn)).length, 0);
});

test("T2d sent errors retain reservations and never retry unknown usage; missing credential releases", async () => {
  for (const [status, type, reason] of [[401, "authentication_error", "ProviderUnavailable"], [402, "billing_error", "CreditExhausted"], [429, "rate_limit_error", "RateLimited"]] as const) {
    const f = await fixture(); let calls = 0;
    const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return new Response(JSON.stringify({ type: "error", error: { type, message: "SYN raw error" } }), { status, headers: { "content-type": "application/json" } }); } });
    assert.equal((await runAssistantTurn(f.turn, { env, adapter })).reason, reason);
    assert.equal(calls, 1); assert.equal((await ledger(f.turn))[0].state, "Unknown");
  }
  const f = await fixture();
  const missing = createClaudeAdapter({ env: { ...env, PPO_ANTHROPIC_API_KEY: "" }, transport: async () => assert.fail("missing key") });
  await runAssistantTurn(f.turn, { env, adapter: missing });
  assert.ok((await ledger(f.turn)).every(e => e.state === "Released"));
});

test("T2d citation/text failures settle known usage, and decline stores only the fixed CannotAnswer body", async () => {
  for (const [payload, reason] of [
    [{ ...answer, claims: [{ text: claim, source_ids: ["S999"] }] }, "InvalidCitation"],
    [{ ...answer, claims: [{ text: "SYN https://example.invalid", source_ids: ["S1"] }] }, "UnsafeOutput"],
  ] as const) {
    const f = await fixture(); const adapter = createClaudeAdapter({ env, transport: async () => response({ content: [{ type: "text", text: JSON.stringify(payload) }] }) });
    assert.equal((await runAssistantTurn(f.turn, { env, adapter })).reason, reason);
    assert.equal((await ledger(f.turn))[0].state, "Settled"); assert.equal((await messages(f.turn)).length, 0);
  }
  const f = await fixture(), adapter = createClaudeAdapter({ env, transport: async () => response({ stop_reason: "refusal", content: [{ type: "text", text: "SYN secret partial" }] }) });
  assert.deepEqual(await runAssistantTurn(f.turn, { env, adapter }), { state: "CannotAnswer", reason: "Declined" });
  assert.equal((await messages(f.turn))[0].body, "Carl can't help with that request.");
  assert.equal((await ledger(f.turn))[0].settled_micro, 3698);
});

test("T2d unexpected billing usage retains full reservation and stops", async () => {
  for (const reported of [{ ...usage, cache_read_input_tokens: 10 }, { ...usage, output_tokens_details: { future_billable_tokens: 1 } }]) {
    const f = await fixture(); let calls = 0;
    const adapter = createClaudeAdapter({ env, transport: async () => { calls++; return response({ usage: reported }); } });
    assert.equal((await runAssistantTurn(f.turn, { env, adapter })).reason, "MalformedOutput");
    assert.equal(calls, 1); assert.equal((await ledger(f.turn))[0].state, "Unknown");
    assert.equal((await ledger(f.turn))[0].reserved_micro, 176000);
  }
});

test("T2d reservation-first concurrency refuses a competing turn at the ceiling before transport", async () => {
  const a = await fixture(), b = await fixture();
  await database().query("UPDATE ppo.assistant_budget_settings SET monthly_ceiling_micro=176000 WHERE workspace_id=$1", [a.p.workspace_id]);
  let release!: () => void, entered!: () => void, calls = 0;
  const waiting = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
  const adapter = createClaudeAdapter({ env, transport: async () => { calls++; entered(); await waiting; return response(); } });
  const first = runAssistantTurn(a.turn, { env, adapter }); await started;
  try { assert.deepEqual(await runAssistantTurn(b.turn, { env, adapter }), { state: "Unavailable", reason: "BudgetSpent" }); }
  finally { release(); }
  assert.equal((await first).state, "Answered"); assert.equal(calls, 1); assert.deepEqual(await ledger(b.turn), []);
});

test("T2d access loss after SDK response settles cost and prevents publication; P3 reason stays private", async () => {
  const f = await fixture();
  const adapter = createClaudeAdapter({ env, transport: async () => {
    await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='conversation.agent.ask'", [f.p.actor_id]);
    return response();
  } });
  assert.deepEqual(await runAssistantTurn(f.turn, { env, adapter }), { state: "Discarded", reason: "ActorLostAccess" });
  assert.equal((await ledger(f.turn))[0].state, "Settled"); assert.equal((await messages(f.turn)).length, 0);
  const other = await readThread(f.other, f.thread);
  assert.equal(JSON.stringify(other).includes("ActorLostAccess"), false);
  await post(f.p, f.thread);
});


test("T2d worker default factory → actual SDK → owned HTTPS transport persists once without adapter injection", async () => {
  const f = await fixture(); let calls = 0; const errors: unknown[] = [];
  const intercepted = mock.method(https, "request", (...args: unknown[]) => {
    calls++;
    const options = args[1] as https.RequestOptions;
    const req = Object.assign(new EventEmitter(), { end(wire: string) {
      void (async () => {
        assert.equal(args[0], "https://api.anthropic.com/v1/messages");
        assert.equal(options.rejectUnauthorized, true); assert.equal(options.agent, false);
        assert.ok(JSON.stringify(options.ca) === JSON.stringify(getCACertificates("bundled")));
        assert.equal((options.headers as Record<string, string>)["x-api-key"], env.PPO_ANTHROPIC_API_KEY);
        const body = JSON.parse(wire); assert.equal(body.model, claudeModel); assert.equal(body.speed, undefined);
        assert.deepEqual((await ledger(f.turn)).map(e => [e.state, e.reserved_micro]), [["Reserved", 176000]]);
        for (const secret of [f.p.actor_id, f.other.actor_id, f.deal, f.thread]) assert.equal(wire.includes(secret), false);
        const res = Object.assign(new EventEmitter(), { statusCode: 200, headers: { "content-type": "application/json" } });
        const payload = await response().text();
        (args[2] as (res: IncomingMessage) => void)(res as unknown as IncomingMessage);
        res.emit("data", Buffer.from(payload)); res.emit("end");
      })().catch(e => { errors.push(e); req.emit("error", e); });
    } });
    return req as unknown as ReturnType<typeof https.request>;
  });
  try {
    await Promise.all([runAssistantTurns(10, { env }), runAssistantTurns(10, { env })]);
    assert.deepEqual(errors, []); assert.equal(calls, 1);
    assert.deepEqual((await ledger(f.turn)).map(e => [e.state, e.settled_micro]), [["Settled", 3698]]);
    assert.equal((await messages(f.turn)).length, 1);
    await postMessage(f.p, f.thread, f.input); await closeDatabase();
    await runAssistantTurns(10, { env }); await runAssistantTurn(f.turn, { env });
    assert.equal(calls, 1); assert.equal((await messages(f.turn)).length, 1);
    const view = await readThread(f.p, f.thread);
    assert.ok(view.messages.some(m => "agent" in m && m.agent?.label === "Claude" && m.agent.sources[0]?.can_open));
  } finally { intercepted.mock.restore(); }
});

test("T2d long persisted history trims again on retry, settles fresh reservations and retains truthful immutable footer", async () => {
  const p = await principal(profiles.coordinator), deal = await newDeal(p), thread = await begin(p, deal);
  for (let i = 0; i < 19; i++) await post(p, thread, { body: `SYN history ${i} ` + "x".repeat(3980) });
  const trigger = await post(p, thread, { body: "SYN @{1} what is recorded?", mentions: [{ ordinal: 1, kind: "Agent" }] });
  const turn = (await rows("SELECT id FROM ppo.assistant_turns WHERE trigger_message_id=$1", [trigger]))[0].id;
  const history: { size: number; left_out: number }[] = [];
  const adapter = createClaudeAdapter({ env, transport: async (_url, init) => {
    const body = JSON.parse(String(init.body)), projected = JSON.parse(body.messages[0].content);
    const e = projected.envelope;
    history.push({ size: e.messages.length, left_out: e.left_out });
    assert.equal(e.messages.at(-1).text, projected.question.text);
    assert.equal(e.coverage.messages.returned, e.messages.length); assert.equal(e.coverage.messages.more, true);
    assert.equal(e.left_out, 20 - e.messages.length);
    assert.ok(e.messages[0].text.startsWith(`SYN history ${19 - (e.messages.length - 1)} `));
    assert.equal(e.items[0].source_id, "S1");
    if (history.length === 1) return response({ usage: { input_tokens: 18000, output_tokens: 100 }, content: [{ type: "text", text: "{" }] });
    return response();
  } });
  assert.equal((await runAssistantTurn(turn, { env, adapter })).state, "Answered");
  assert.equal(history.length, 2); assert.ok(history[1].size < history[0].size); assert.ok(history[0].size < 20);
  assert.deepEqual((await ledger(turn)).map(e => [e.state, e.reserved_micro, e.settled_micro]), [["Settled", 176000, 37000], ["Settled", 139000, 3698]]);
  const stored = (await rows("SELECT id,body,left_out_count FROM ppo.conversation_messages WHERE turn_id=$1", [turn]))[0];
  assert.equal(stored.left_out_count, history[1].left_out);
  assert.match(stored.body, /earlier messages left out to fit the request allowance/);
  assert.doesNotMatch(stored.body, /not everyone here/);
  const view = await readThread(p, thread);
  assert.equal(view.messages.find(m => m.id === stored.id)!.body, stored.body);
  await runAssistantTurn(turn, { env, adapter }); assert.equal(history.length, 2);
});
