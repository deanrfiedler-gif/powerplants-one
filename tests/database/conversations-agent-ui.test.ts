import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { mentionablePeople, readThread } from "../../src/conversations/reads";
import { postMessage } from "../../src/conversations/commands";
import { runAssistantTurns } from "../../src/assistant/turns";
import {
  begin,
  code,
  messageInput,
  newDeal,
  person,
  post,
  principal,
  profiles,
  rows,
} from "../helpers/conversations";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
const originalSwitch = process.env.PPO_ASSISTANT;
beforeEach(async () => {
  await reset();
  process.env.PPO_ASSISTANT = "on";
});
after(async () => {
  if (originalSwitch === undefined) delete process.env.PPO_ASSISTANT;
  else process.env.PPO_ASSISTANT = originalSwitch;
  await closeDatabase();
});

test("T2c picker exposes Carl only when enabled with anchor-scoped ask authority; people remain available", async () => {
  const p = await principal(profiles.coordinator),
    deal = await newDeal(p);
  const anchor = { anchor_type: "Opportunity", anchor_id: deal };
  const enabled = await mentionablePeople(p, anchor);
  assert.deepEqual(enabled.agent, {
    name: "Carl",
    label: "Carl · AI assistant",
  });
  assert.ok(enabled.items.length);
  assert.ok(enabled.items.every((item) => typeof item.role === "string"));
  process.env.PPO_ASSISTANT = "off";
  assert.equal((await mentionablePeople(p, anchor)).agent, null);
  assert.deepEqual((await mentionablePeople(p, anchor)).items, enabled.items);
  process.env.PPO_ASSISTANT = "on";
  await database().query(
    "UPDATE ppo.permission_grants SET scope_type='Company',scope_id='20000000-0000-4000-8000-000000000002',company_id='20000000-0000-4000-8000-000000000002',site_id=NULL WHERE user_id=$1 AND capability='conversation.agent.ask'",
    [p.actor_id],
  );
  assert.equal(
    (await mentionablePeople(p, anchor)).agent,
    null,
    "an unrelated-company ask grant cannot expose Carl",
  );
  assert.ok((await mentionablePeople(p, anchor)).items.length);
});

test("T2c R8 warns with count-only evidence before adding a new reader; exact acknowledgement and replay preserve one post", async () => {
  const p = await principal(profiles.coordinator),
    newcomer = await principal(profiles.dealReader);
  const deal = await newDeal(p),
    thread = await begin(p, deal);
  await post(p, thread, {
    body: "SYN @{1} what is recorded?",
    mentions: [{ ordinal: 1, kind: "Agent" }],
  });
  await runAssistantTurns(10);
  assert.equal((await readThread(p, thread)).turns[0].state, "Answered");
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.read'",
    [newcomer.actor_id],
  );
  const picker = await mentionablePeople(p, {
    anchor_type: "Opportunity",
    anchor_id: deal,
    thread_id: thread,
  });
  const warning = picker.items.find(
    (item) => item.id === newcomer.actor_id,
  )?.history_warning;
  assert.ok(warning && warning.count > 0);
  assert.deepEqual(Object.keys(warning).sort(), ["basis", "count"]);
  assert.match(warning.basis, /^[a-f0-9]{64}$/);
  const input = messageInput({
    body: "SYN @{1} please check",
    mentions: [person(newcomer.actor_id)],
  });
  await assert.rejects(
    postMessage(p, thread, input),
    code("ParticipantWarningRequired"),
  );
  assert.equal(
    (
      await rows(
        "SELECT 1 FROM ppo.conversation_participants WHERE thread_id=$1 AND user_id=$2",
        [thread, newcomer.actor_id],
      )
    ).length,
    0,
  );
  const stale = {
    ...input,
    participant_acknowledgements: [
      { person_id: newcomer.actor_id, basis: warning.basis },
    ],
  };
  await post(p, thread, {
    body: "SYN @{1} check again",
    mentions: [{ ordinal: 1, kind: "Agent" }],
  });
  await runAssistantTurns(10);
  await assert.rejects(
    postMessage(p, thread, stale),
    code("ParticipantWarningRequired"),
  );
  const fresh = await mentionablePeople(p, {
    anchor_type: "Opportunity",
    anchor_id: deal,
    thread_id: thread,
  });
  const current = fresh.items.find(
    (item) => item.id === newcomer.actor_id,
  )!.history_warning!;
  assert.notEqual(current.basis, warning.basis);
  const confirmed = {
    ...input,
    participant_acknowledgements: [
      { person_id: newcomer.actor_id, basis: current.basis },
    ],
  };
  const saved = await postMessage(p, thread, confirmed);
  assert.equal((await postMessage(p, thread, confirmed)).replayed, true);
  assert.equal(
    (
      await rows("SELECT id FROM ppo.conversation_messages WHERE id=$1", [
        saved.receipt.record_id,
      ])
    ).length,
    1,
  );
  const view = await readThread(newcomer, thread);
  const answer = view.messages.find((m) => m.author_kind === "Agent");
  assert.ok(
    answer &&
      "agent" in answer &&
      answer.agent?.sources.some((s) => !s.can_open),
  );
  assert.ok(
    answer.agent.claims.filter((c) => c.withheld).every((c) => c.text === null),
  );
});
