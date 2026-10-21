import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { postMessage, startThread } from "../../src/conversations/commands";
import { readThread } from "../../src/conversations/reads";
import {
  begin, code, messageInput, newDeal, person, principal, profiles, rows, threadInput,
} from "../helpers/conversations";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const agent = { ordinal: 1, kind: "Agent" };
const tagged = () => messageInput({ body: "SYN @{1} what is recorded?", mentions: [agent] });

test("T2-1 tagging Carl creates one queued turn with the message, atomically", async () => {
  const p = await principal(profiles.coordinator), deal = await newDeal(p);
  const input = threadInput(deal, tagged());
  const created = await startThread(p, input), thread = created.receipt.record_id;
  assert.equal((await startThread(p, input)).replayed, true);
  const post = tagged(), first = await postMessage(p, thread, post);
  assert.equal((await postMessage(p, thread, post)).replayed, true);
  const turns = await rows("SELECT id,thread_id,trigger_message_id,acted_for_id,state FROM ppo.assistant_turns ORDER BY created_at");
  assert.equal(turns.length, 2);
  assert.ok(turns.every(t => t.state === "Queued" && t.thread_id === thread && t.acted_for_id === p.actor_id));
  assert.equal(turns[1].trigger_message_id, first.receipt.record_id);
  const view = await readThread(p, thread);
  assert.equal(view.messages.length, 2);
  assert.deepEqual(view.messages[0].mentions, [{ ordinal: 1, kind: "Agent", display_name: "Carl" }]);
  assert.ok(view.messages.every(m => m.author_kind === "Person"));
  assert.equal(view.turns.length, 2);
  const events = await rows("SELECT details FROM ppo.audit_events WHERE operation_id=ANY($1::uuid[])", [[input.operation_id, post.operation_id]]);
  assert.deepEqual(events.map(e => e.details.agent_turn_id).sort(), turns.map(t => t.id).sort());
  const before = await rows("SELECT id FROM ppo.conversation_messages ORDER BY id");
  await assert.rejects(postMessage(p, thread, {
    ...tagged(), body: "SYN @{1} and @{2}", mentions: [agent, person(p.actor_id, 2)],
    asks: [{ ordinal: 2, question: "SYN self ask?" }],
  }), code("SelfAsk"));
  assert.deepEqual(await rows("SELECT id FROM ppo.conversation_messages ORDER BY id"), before);
  assert.equal((await rows("SELECT id FROM ppo.assistant_turns")).length, 2);
});

test("W2 only a holder of conversation.agent.ask can tag Carl", async () => {
  const p = await principal(profiles.coordinator), deal = await newDeal(p), thread = await begin(p, deal);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='conversation.agent.ask'", [p.actor_id]);
  await assert.rejects(postMessage(p, thread, tagged()), code("TagNotPermitted"));
  await assert.rejects(startThread(p, threadInput(deal, tagged())), code("TagNotPermitted"));
  assert.equal((await rows("SELECT id FROM ppo.conversation_messages")).length, 1);
  assert.equal((await rows("SELECT id FROM ppo.assistant_turns")).length, 0);
  await postMessage(p, thread, messageInput());
  assert.equal((await readThread(p, thread)).messages.length, 2);
});

test("W2 current ask authority precedes a tagged message's original receipt", async () => {
  const p = await principal(profiles.coordinator), deal = await newDeal(p), thread = await begin(p, deal);
  const input = tagged();
  await postMessage(p, thread, input);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='conversation.agent.ask'", [p.actor_id]);
  await assert.rejects(postMessage(p, thread, input), code("TagNotPermitted"));
  assert.equal((await rows("SELECT id FROM ppo.assistant_turns")).length, 1);
});

test("W4 Carl and a person together: the person's ask stays open", async () => {
  const p = await principal(profiles.coordinator), other = await principal(profiles.dealReader);
  const thread = await begin(p, await newDeal(p));
  await postMessage(p, thread, messageInput({
    body: "SYN @{1} summarise; @{2} when can you check?",
    mentions: [agent, person(other.actor_id, 2)], asks: [{ ordinal: 2, question: "SYN When can you check?" }],
  }));
  const view = await readThread(p, thread);
  assert.equal(view.asks[0].state, "Open");
  assert.equal(view.turns[0].state, "Queued");
  assert.equal(view.participants.length, 2, "the agent has no participant or user row");
});
