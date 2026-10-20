import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { recordOperation } from "../../src/platform/operations";
import { reserveCall, settleCall, releaseCall, keepUnknown, monthSpend } from "../../src/assistant/budget";
import { priceFor, type Price } from "../../src/assistant/pricing";
import { begin, code, newDeal, principal, profiles, rows } from "../helpers/conversations";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

// This rate exists only in tests. Production priceFor knows only the zero-cost simulated pair.
const price: Price = {
  adapter: "Simulated", model: "simulated-1", input_micro_per_mtok: 2_000_000, output_micro_per_mtok: 10_000_000,
  version: "SYN-test-2-10", checked: "2026-10-20",
};
const allowance = { input_tokens: 48_000, output_tokens: 8_000 };
const usage = { input_tokens: 6_000, output_tokens: 1_000 };
async function fixture(count = 1) {
  const p = await principal(profiles.coordinator), thread = await begin(p, await newDeal(p));
  const turns: string[] = [];
  // Task 6 adds the tagging command. These fixtures use the schema's full message/audit graph.
  for (let index = 0; index < count; index++) {
    const turn = randomUUID(), message = randomUUID(), operation = randomUUID(), sequence = index + 2;
    await transaction(async c => {
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [p.workspace_id]);
      const created = (await c.query(
        "INSERT INTO ppo.conversation_messages(id,workspace_id,thread_id,sequence,author_id,body,operation_id) VALUES($1,$2,$3,$4,$5,'SYN @{1} budget proof',$6) RETURNING created_at",
        [message, p.workspace_id, thread, sequence, p.actor_id, operation],
      )).rows[0].created_at;
      await c.query("INSERT INTO ppo.conversation_mentions(workspace_id,message_id,ordinal,kind) VALUES($1,$2,1,'Agent')", [p.workspace_id, message]);
      await c.query("INSERT INTO ppo.assistant_turns(id,workspace_id,thread_id,trigger_message_id,acted_for_id) VALUES($1,$2,$3,$4,$5)",
        [turn, p.workspace_id, thread, message, p.actor_id]);
      await recordOperation(c, p, { operation_id: operation, reason: "SYN budget fixture" },
        { id: message, version: sequence, state: "Posted", updated_at: created }, "ConversationMessage", "ConversationChanged", "a".repeat(64),
        { command: "Conversation:PostMessage", thread_id: thread, agent_turn_id: turn });
      await c.query(
        "UPDATE ppo.assistant_turns SET state='Answering',version=version+1,started_at=clock_timestamp(),lease_until=clock_timestamp()+interval '2 minutes',adapter='Simulated',model='simulated-1' WHERE id=$1",
        [turn],
      );
    });
    turns.push(turn);
  }
  return { w: p.workspace_id, turns };
}
const spend = (workspace: string) => transaction(c => monthSpend(c, workspace));
const ceiling = (workspace: string, amount: number) => database().query(
  "UPDATE ppo.assistant_budget_settings SET monthly_ceiling_micro=$2 WHERE workspace_id=$1", [workspace, amount],
);
const entry = async (id: string) => (await rows(
  "SELECT state,reserved_micro::int,settled_micro::int,input_tokens,output_tokens,period::text FROM ppo.assistant_budget_entries WHERE id=$1", [id],
))[0];

test("reserve, settle and release use integer micro-USD; a full test-price call reserves 176000", async () => {
  const { w, turns } = await fixture();
  const first = await transaction(c => reserveCall(c, w, turns[0], 1, price, allowance));
  assert.equal((await entry(first)).reserved_micro, 176000);
  assert.deepEqual(await spend(w), { ceiling: 30000000, committed: 176000 });
  await transaction(c => settleCall(c, w, first, price, usage));
  assert.deepEqual(await spend(w), { ceiling: 30000000, committed: 22000 });
  assert.equal((await entry(first)).state, "Settled");
  const second = await transaction(c => reserveCall(c, w, turns[0], 2, price, allowance));
  assert.equal((await spend(w)).committed, 198000);
  await transaction(c => releaseCall(c, w, second));
  assert.equal((await entry(second)).state, "Released");
  assert.equal((await spend(w)).committed, 22000);
});

test("an Unknown reservation keeps its maximum, cannot be released, and may later settle known usage", async () => {
  const { w, turns } = await fixture();
  const id = await transaction(c => reserveCall(c, w, turns[0], 1, price, allowance));
  await transaction(c => keepUnknown(c, w, id));
  await transaction(c => keepUnknown(c, w, id));
  assert.equal((await entry(id)).state, "Unknown");
  assert.equal((await spend(w)).committed, 176000);
  await assert.rejects(transaction(c => releaseCall(c, w, id)), code("InvalidReservation"));
  assert.equal((await spend(w)).committed, 176000);
  await transaction(c => settleCall(c, w, id, price, usage));
  assert.equal((await spend(w)).committed, 22000);
  assert.equal((await entry(id)).state, "Settled");
});

test("UTC months keep committed spend separate, independent of the connection timezone", async () => {
  const { w, turns } = await fixture();
  await ceiling(w, 176000);
  const old = randomUUID();
  await transaction(c => c.query(
    `INSERT INTO ppo.assistant_budget_entries(id,workspace_id,turn_id,call_index,period,adapter,model,price_version,max_input_tokens,max_output_tokens,reserved_micro)
     VALUES($1,$2,$3,1,(date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')-interval '1 month')::date,'Simulated','simulated-1',$4,48000,8000,176000)`,
    [old, w, turns[0], price.version],
  ));
  assert.equal((await spend(w)).committed, 0);
  const current = await transaction(async c => {
    await c.query("SET LOCAL TIME ZONE 'Pacific/Kiritimati'");
    return reserveCall(c, w, turns[0], 2, price, allowance);
  });
  const month = (await rows("SELECT date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date::text AS period"))[0].period;
  assert.equal((await entry(current)).period, month);
  assert.equal((await spend(w)).committed, 176000);
  await transaction(c => settleCall(c, w, old, price, usage));
  assert.equal((await spend(w)).committed, 176000);
});

test("two turns racing for the last call under the ceiling reserve exactly once", async () => {
  const { w, turns } = await fixture(2);
  await ceiling(w, 176000);
  const results = await Promise.allSettled(turns.map(turn => transaction(c => reserveCall(c, w, turn, 1, price, allowance))));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const refused = results.find(r => r.status === "rejected");
  assert.ok(refused?.status === "rejected" && code("BudgetSpent")(refused.reason));
  assert.equal((await spend(w)).committed, 176000);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.assistant_budget_entries WHERE workspace_id=$1", [w]))[0].n, 1);
});

test("zero-cost simulated calls still reserve and settle; a spent or missing ceiling fails closed", async () => {
  const { w, turns } = await fixture(), simulated = priceFor("Simulated", "simulated-1")!;
  const id = await transaction(c => reserveCall(c, w, turns[0], 1, simulated, allowance));
  assert.equal((await entry(id)).state, "Reserved");
  await transaction(c => settleCall(c, w, id, simulated, usage));
  assert.equal((await entry(id)).state, "Settled");
  assert.equal((await entry(id)).settled_micro, 0);
  await ceiling(w, 0);
  await assert.rejects(transaction(c => reserveCall(c, w, turns[0], 2, simulated, allowance)), code("BudgetSpent"));
  const foreign = "10000000-0000-4000-8000-000000000002";
  await database().query("DELETE FROM ppo.assistant_budget_settings WHERE workspace_id=$1", [foreign]);
  await assert.rejects(spend(foreign), code("BudgetSpent"));
});

test("an original reservation and settlement replay exactly; changed pricing or usage cannot rewrite it", async () => {
  const { w, turns } = await fixture();
  await ceiling(w, 176000);
  const id = await transaction(c => reserveCall(c, w, turns[0], 1, price, allowance));
  assert.equal(await transaction(c => reserveCall(c, w, turns[0], 1, price, allowance)), id);
  await assert.rejects(transaction(c => reserveCall(c, w, turns[0], 1, { ...price, version: "SYN changed price" }, allowance)), code("OperationConflict"));
  await assert.rejects(transaction(c => settleCall(c, w, id, { ...price, version: "SYN changed price" }, usage)), code("OperationConflict"));
  await assert.rejects(transaction(c => settleCall(c, w, id, { ...price, input_micro_per_mtok: 1_000_000 }, usage)), code("OperationConflict"));
  await assert.rejects(transaction(c => settleCall(c, w, id, price, { ...usage, input_tokens: 48001 })), code("TurnLimit"));
  await transaction(c => settleCall(c, w, id, price, usage));
  await transaction(c => settleCall(c, w, id, price, usage));
  await assert.rejects(transaction(c => reserveCall(c, w, turns[0], 1, price, allowance)), code("InvalidReservation"));
  await assert.rejects(transaction(c => settleCall(c, w, id, price, { ...usage, output_tokens: 1001 })), code("OperationConflict"));
  assert.equal((await spend(w)).committed, 22000);
  await assert.rejects(transaction(c => reserveCall(c, w, turns[0], 7, price, allowance)), code("TurnLimit"));
  await assert.rejects(transaction(c => reserveCall(c, w, turns[0], 2, price, { input_tokens: -1, output_tokens: 0 })), code("TurnLimit"));
});

test("a stale repeatable-read snapshot cannot reserve after another turn spent the remaining ceiling", async () => {
  const { w, turns } = await fixture(2);
  await ceiling(w, 176000);
  await transaction(async stale => {
    await stale.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    assert.equal((await monthSpend(stale, w)).committed, 0);
    await transaction(c => reserveCall(c, w, turns[0], 1, price, allowance));
    assert.equal((await monthSpend(stale, w)).committed, 0, "the losing transaction holds the old snapshot");
    await assert.rejects(reserveCall(stale, w, turns[1], 1, price, allowance), code("InvalidReservation"));
    await stale.query("SAVEPOINT direct_write");
    await assert.rejects(stale.query(
      `INSERT INTO ppo.assistant_budget_entries(id,workspace_id,turn_id,call_index,period,adapter,model,price_version,max_input_tokens,max_output_tokens,reserved_micro)
       VALUES($1,$2,$3,1,date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date,'Simulated','simulated-1',$4,48000,8000,176000)`,
      [randomUUID(), w, turns[1], price.version],
    ), code("25001"));
    await stale.query("ROLLBACK TO SAVEPOINT direct_write");
  });
  assert.equal((await spend(w)).committed, 176000);
});
