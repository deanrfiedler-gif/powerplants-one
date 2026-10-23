import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import type { Principal } from "../../src/platform/identity";
import type { QueryClient } from "../../src/platform/permissions";
import { canonical } from "../../src/platform/operations";
import { sourceKey } from "../../src/assistant/source-access";
import { participantWarnings } from "../../src/conversations/participant-warning";

const p: Principal = {
  workspace_id: "SYN-workspace",
  actor_id: "SYN-poster",
  display_name: "SYN Poster",
};
const thread = "SYN-thread",
  person = "SYN-new-reader";
const sources = [1, 2, 3].map((number) => ({
  message_id: "SYN-answer",
  number,
  type: "Activity" as const,
  record_id: `SYN-activity-${number}`,
}));

function client(
  allowed = sources.slice(0, 2).map(sourceKey),
  history = sources,
  participants: string[] = [],
) {
  return {
    async query(sql: string, args: unknown[]) {
      if (sql.includes("FROM ppo.conversation_participants"))
        return { rows: participants.map((user_id) => ({ user_id })) };
      if (sql.includes("FROM ppo.conversation_message_sources"))
        return { rows: history };
      assert.ok(sql.startsWith("SELECT a.id FROM ppo.activities"));
      return {
        rows: history
          .filter(
            (s) =>
              (args[2] as string[]).includes(s.record_id) &&
              allowed.includes(sourceKey(s)),
          )
          .map((s) => ({ id: s.record_id })),
      };
    },
  } as unknown as QueryClient;
}

test("R8 count-only basis cannot be matched by enumerating a colleague's readable source subsets", async () => {
  const warning = (
    await participantWarnings(client(), p, thread, [person])
  ).get(person)!;
  assert.equal(warning.count, 1);
  assert.deepEqual(Object.keys(warning).sort(), ["basis", "count"]);
  assert.match(warning.basis, /^[a-f0-9]{64}$/);
  const matches: string[][] = [];
  for (let mask = 0; mask < 1 << sources.length; mask++) {
    const allowed = sources
      .filter((_, index) => mask & (1 << index))
      .map(sourceKey)
      .sort();
    if (allowed.length !== sources.length - warning.count) continue;
    const guess = createHash("sha256")
      .update(
        canonical({
          workspace: p.workspace_id,
          actor: p.actor_id,
          thread,
          person,
          sources,
          allowed,
        }),
      )
      .digest("hex");
    if (guess === warning.basis) matches.push(allowed);
  }
  assert.deepEqual(
    matches,
    [],
    "The public count and source history must not reveal the colleague's readable subset",
  );
});

test("R8 basis is stable for unchanged reads and binds actor, workspace, thread, person, history and access", async () => {
  const basis = async (
    c = client(),
    actor = p,
    id = thread,
    candidate = person,
  ) =>
    (await participantWarnings(c, actor, id, [candidate])).get(candidate)!
      .basis;
  const original = await basis();
  assert.equal(await basis(), original);
  for (const changed of [
    await basis(client(), { ...p, actor_id: "SYN-other-poster" }),
    await basis(client(), { ...p, workspace_id: "SYN-other-workspace" }),
    await basis(client(), p, "SYN-other-thread"),
    await basis(client(), p, thread, "SYN-other-new-reader"),
    await basis(
      client(
        undefined,
        sources.map((s) => ({ ...s, message_id: "SYN-new-answer" })),
      ),
    ),
    await basis(client([sourceKey(sources[0]), sourceKey(sources[2])])),
  ])
    assert.notEqual(changed, original);
});

test("R8 existing participants and fully readable history require no acknowledgement", async () => {
  assert.equal(
    (
      await participantWarnings(
        client(undefined, sources, [person]),
        p,
        thread,
        [person],
      )
    ).size,
    0,
  );
  assert.equal(
    (
      await participantWarnings(client(sources.map(sourceKey)), p, thread, [
        person,
      ])
    ).size,
    0,
  );
});
