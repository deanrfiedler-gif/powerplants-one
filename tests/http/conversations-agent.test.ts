import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { storedAgentThread } from "../helpers/conversations-agent";
import { messageInput, person } from "../helpers/conversations";
import { participantWarnings } from "../../src/conversations/participant-warning";

after(closeDatabase);
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function login(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function read(cookie: string, path: string) {
  const r = await fetch(`${origin}/api/v1/${path}`, { headers: { cookie } });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
  return r.json();
}

test("T2c HTTP exposes projected stored answers and tagger-only turn reasons through the existing routes", async () => {
  const f = await storedAgentThread(),
    owner = await login("coordinator"),
    reader = await login("crm-receiver");
  const people = await read(
    owner,
    `conversations/people?anchor_type=Opportunity&anchor_id=${f.deal}&thread_id=${f.thread}`,
  );
  assert.ok(
    people.items.some((p: { id: string }) => p.id === f.reader.actor_id),
  );
  assert.ok(
    people.agent === null || people.agent.label === "Carl · AI assistant",
  );
  const view = await read(reader, `conversations/${f.thread}`);
  const answer = view.messages.find(
    (m: { author_kind: string }) => m.author_kind === "Agent",
  );
  assert.equal(answer.agent.label, "Simulated");
  assert.equal(answer.acted_for.user_id, f.owner.actor_id);
  assert.ok(answer.agent.sources.length);
  const unavailable = await storedAgentThread(false);
  assert.equal(
    (await read(owner, `conversations/${unavailable.thread}`)).turns[0].reason,
    "FeatureOff",
  );
  const other = await read(reader, `conversations/${unavailable.thread}`);
  assert.equal(other.turns[0].state, "Unavailable");
  assert.equal(other.turns[0].reason, null);
  assert.equal(
    other.messages.filter(
      (m: { author_kind: string }) => m.author_kind === "Agent",
    ).length,
    0,
  );
});

test("T2c R8 HTTP accepts its server's opaque basis, refuses another process's basis and recovers one post", async () => {
  const f = await storedAgentThread(true, false),
    c = database(),
    owner = await login("coordinator");
  const grants = (
    await c.query<{ id: string; valid_until: Date | null }>(
      "SELECT id,valid_until FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.read'",
      [f.reader.actor_id],
    )
  ).rows;
  assert.ok(grants.length);
  try {
    await c.query(
      "UPDATE ppo.permission_grants SET valid_until=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'",
      [f.reader.actor_id],
    );
    const people = await read(
      owner,
      `conversations/people?anchor_type=Opportunity&anchor_id=${f.deal}&thread_id=${f.thread}`,
    );
    const warning = people.items.find(
      (item: { id: string }) => item.id === f.reader.actor_id,
    ).history_warning;
    assert.ok(warning.count > 0);
    const foreign = (
      await participantWarnings(c, f.owner, f.thread, [f.reader.actor_id])
    ).get(f.reader.actor_id)!;
    assert.equal(foreign.count, warning.count);
    assert.notEqual(
      foreign.basis,
      warning.basis,
      "Identical public inputs from another server process cannot derive this acknowledgement",
    );
    const input = messageInput({
      body: "SYN @{1} join after reviewing the warning",
      mentions: [person(f.reader.actor_id)],
    });
    const send = (basis: string) =>
      fetch(`${origin}/api/v1/conversations/${f.thread}/messages`, {
        method: "POST",
        headers: { cookie: owner, origin, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          participant_acknowledgements: [
            { person_id: f.reader.actor_id, basis },
          ],
        }),
      });
    const refused = await send(foreign.basis);
    assert.equal(refused.status, 409);
    assert.equal((await refused.json()).code, "ParticipantWarningRequired");
    assert.equal(
      (
        await c.query(
          "SELECT 1 FROM ppo.conversation_participants WHERE thread_id=$1 AND user_id=$2",
          [f.thread, f.reader.actor_id],
        )
      ).rowCount,
      0,
    );
    const saved = await send(warning.basis);
    assert.equal(saved.status, 201);
    const receipt = await saved.json();
    const replayed = await send(warning.basis);
    assert.equal(replayed.status, 200);
    assert.equal((await replayed.json()).receipt_id, receipt.receipt_id);
    assert.equal(
      (
        await c.query("SELECT 1 FROM ppo.conversation_messages WHERE id=$1", [
          receipt.record_id,
        ])
      ).rowCount,
      1,
    );
    const reader = await login("crm-receiver"),
      view = await read(reader, `conversations/${f.thread}`);
    assert.ok(
      view.messages.some(
        (message: { agent?: { sources: { can_open: boolean }[] } }) =>
          message.agent?.sources.some((source) => !source.can_open),
      ),
    );
  } finally {
    for (const grant of grants)
      await c.query(
        "UPDATE ppo.permission_grants SET valid_until=$2 WHERE id=$1",
        [grant.id, grant.valid_until],
      );
  }
});
