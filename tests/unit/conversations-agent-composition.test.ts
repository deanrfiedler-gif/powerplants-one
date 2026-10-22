import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyEdit,
  emptyDraft,
  insertMention,
  segments,
  toMessageInput,
  visibleToken,
  type Draft,
  type DraftMention,
} from "../../src/conversations/composition";
import { deriveTitle } from "../../src/conversations/title";

const carl: DraftMention = { key: "agent", kind: "Agent" };
const human: DraftMention = {
  key: "person",
  kind: "Person",
  person_id: "00000000-0000-4000-8000-000000000001",
  display_name: "Carl Jensen",
};

test("T2c agent and a human called Carl keep distinct tags and only the human has an ask", () => {
  let draft = insertMention(emptyDraft(), carl, 0).draft;
  draft = insertMention(draft, human, draft.text.length).draft;
  draft.asks[0] = {
    ...draft.asks[0],
    on: true,
    question: "When can you check?",
  };
  assert.equal(visibleToken(carl), "@Carl");
  assert.equal(draft.text, "@Carl @Carl Jensen ");
  assert.equal(draft.asks.length, 1);
  const input = toMessageInput(draft);
  assert.ok(input.ok);
  assert.equal(input.body, "@{1} @{2} ");
  assert.deepEqual(input.mentions, [
    { ordinal: 1, kind: "Agent" },
    { ordinal: 2, kind: "Person", person_id: human.person_id },
  ]);
  assert.deepEqual(input.asks, [
    { ordinal: 2, question: "When can you check?", reply_by: null },
  ]);
});

test("T2c editing inside an agent removes the whole atomic tag and preserves the human ask", () => {
  let draft = insertMention(emptyDraft(), carl, 0).draft;
  draft = insertMention(draft, human, draft.text.length).draft;
  const edited = applyEdit(
    draft,
    draft.text.slice(0, 2) + draft.text.slice(3),
  ).draft;
  assert.equal(edited.text, " @Carl Jensen ");
  assert.deepEqual(
    edited.mentions.map((m) => m.kind),
    ["Person"],
  );
  assert.equal(edited.asks.length, 1);
});

test("T2c a second agent insertion is refused and malformed duplicate recovery cannot serialise", () => {
  const draft = insertMention(emptyDraft(), carl, 0).draft;
  assert.deepEqual(
    insertMention(draft, { ...carl, key: "second" }, draft.text.length).draft,
    draft,
  );
  const duplicate: Draft = {
    ...draft,
    text: "@Carl @Carl",
    mentions: [
      { ...carl, at: 0 },
      { ...carl, key: "second", at: 6 },
    ],
  };
  const input = toMessageInput(duplicate);
  assert.equal(input.ok, false);
  assert.match(!input.ok ? input.message : "", /once/i);
});

test("T2c serialised draft recovery preserves the agent identity and a record-free title", () => {
  const draft = insertMention(
    { ...emptyDraft(), text: "What is recorded? " },
    carl,
    0,
  ).draft;
  const recovered = JSON.parse(JSON.stringify(draft)) as Draft;
  assert.deepEqual(toMessageInput(recovered), toMessageInput(draft));
  assert.equal(deriveTitle(recovered, "OPP-1"), "Carl What is recorded?");
  assert.deepEqual(
    segments("@{1} please check", [
      { ordinal: 1, kind: "Agent", display_name: "Carl" },
    ]),
    [
      { kind: "agent", name: "Carl" },
      { kind: "text", text: " please check" },
    ],
  );
});
