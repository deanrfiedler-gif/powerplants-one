import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { storedAgentThread } from "../helpers/conversations-agent";

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
