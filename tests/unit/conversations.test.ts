import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  askDeadlineInput,
  closeAskInput,
  listInput,
  postMessageInput,
  readThroughInput,
  startThreadInput,
  threadStateInput,
} from "../../src/conversations/validation";

const common = () => ({ schema_version: 1, operation_id: randomUUID(), reason: "SYN reason" });
const person = (ordinal = 1) => ({ ordinal, kind: "Person", person_id: randomUUID() });
const record = (ordinal = 1) => ({ ordinal, kind: "Record", record_type: "Project", record_id: randomUUID() });
const start = (extra: Record<string, unknown> = {}) => ({
  ...common(),
  anchor_type: "Opportunity",
  anchor_id: randomUUID(),
  title: "SYN Delivery",
  body: "SYN Hello",
  ...extra,
});
const invalid = (field?: string) => (error: unknown) => {
  const e = error as { code?: string; field_errors?: { field: string }[] };
  return e.code === "InvalidData" && (!field || e.field_errors?.some((f) => f.field === field) === true);
};

test("a message can tag Carl once without a user or record identity", () => {
  const mentions = [{ ordinal: 1, kind: "Agent" }];
  const input = postMessageInput(randomUUID(), { ...common(), body: "SYN @{1} where is the controller?", mentions });
  assert.deepEqual(input.mentions, mentions);
  for (const extra of [{ person_id: randomUUID() }, { record_id: randomUUID() }, { record_type: "Project" }])
    assert.throws(() => postMessageInput(randomUUID(), {
      ...common(), body: "SYN @{1}", mentions: [{ ...mentions[0], ...extra }],
    }), invalid("mentions.0"));
});

test("two Agent mentions are refused even at different ordinals", () => {
  assert.throws(() => postMessageInput(randomUUID(), {
    ...common(), body: "SYN @{1} and @{2}", mentions: [{ ordinal: 1, kind: "Agent" }, { ordinal: 2, kind: "Agent" }],
  }), invalid("mentions"));
});

test("a human ask cannot target the Agent ordinal", () => {
  assert.throws(() => postMessageInput(randomUUID(), {
    ...common(), body: "SYN @{1}", mentions: [{ ordinal: 1, kind: "Agent" }],
    asks: [{ ordinal: 1, question: "SYN When?" }],
  }), invalid("asks.0.ordinal"));
});

test("a thread starts with a title, a record anchor and a plain body", () => {
  const parsed = startThreadInput(start());
  assert.equal(parsed.anchor_type, "Opportunity");
  assert.equal(parsed.body, "SYN Hello");
  assert.deepEqual(parsed.mentions, []);
  assert.deepEqual(parsed.asks, []);
  assert.throws(() => startThreadInput(start({ anchor_type: "Ticket" })), invalid("anchor_type"));
  assert.throws(() => startThreadInput(start({ title: "" })), invalid("title"));
  assert.throws(() => startThreadInput(start({ body: "" })), invalid("body"));
  assert.throws(() => startThreadInput(start({ body: "x".repeat(4001) })), invalid("body"));
  assert.throws(() => startThreadInput(start({ attachments: [] })), invalid("attachments"));
  assert.throws(() => startThreadInput(start({ schema_version: 2 })), invalid("schema_version"));
});

test("placeholders must match the mentions one to one and in kind", () => {
  const one = person(1),
    link = record(2);
  const ok = postMessageInput(randomUUID(), { ...common(), body: "SYN @{1} see #{2}", mentions: [one, link] });
  assert.deepEqual(ok.mentions.map((m) => [m.ordinal, m.kind]), [[1, "Person"], [2, "Record"]]);
  const bad = (body: string, mentions: unknown[]) => () => postMessageInput(randomUUID(), { ...common(), body, mentions });
  assert.throws(bad("SYN no placeholder", [one]), invalid("body"));
  assert.throws(bad("SYN @{1}", []), invalid("body"));
  assert.throws(bad("SYN @{1} @{1}", [one]), invalid("body"));
  assert.throws(bad("SYN #{1}", [one]), invalid("body"), "a record placeholder cannot stand for a person");
  assert.throws(bad("SYN @{1}", [one, { ...person(1) }]), invalid("mentions"));
  assert.throws(bad("SYN @{0}", [person(0)]), invalid());
  assert.throws(bad("SYN @{21}", [person(21)]), invalid());
  assert.throws(bad("SYN @{1}", [{ ...one, record_id: randomUUID() }]), invalid());
  assert.throws(bad("SYN #{1}", [{ ...record(1), person_id: randomUUID() }]), invalid());
  assert.throws(bad("SYN @{1}", [{ ...one, person_id: "not-a-uuid" }]), invalid());
  assert.throws(bad("SYN @{1}", Array.from({ length: 21 }, (_, i) => person(i + 1))), invalid("mentions"));
});

test("an ask is made of a tagged person, with a question and an optional real date", () => {
  const base = { ...common(), body: "SYN @{1} when?", mentions: [person(1)] };
  const parsed = postMessageInput(randomUUID(), { ...base, asks: [{ ordinal: 1, question: "SYN When?", reply_by: "2031-12-01" }] });
  assert.deepEqual(parsed.asks, [{ ordinal: 1, question: "SYN When?", reply_by: "2031-12-01" }]);
  assert.equal(postMessageInput(randomUUID(), { ...base, asks: [{ ordinal: 1, question: "SYN When?" }] }).asks[0].reply_by, null);
  const bad = (asks: unknown) => () => postMessageInput(randomUUID(), { ...base, asks });
  assert.throws(bad([{ ordinal: 2, question: "SYN?" }]), invalid("asks.0.ordinal"));
  assert.throws(bad([{ ordinal: 1, question: "" }]), invalid("asks.0.question"));
  assert.throws(bad([{ ordinal: 1, question: "x".repeat(501) }]), invalid("asks.0.question"));
  assert.throws(bad([{ ordinal: 1, question: "SYN?", reply_by: "2031-02-30" }]), invalid("asks.0.reply_by"));
  assert.throws(bad([{ ordinal: 1, question: "SYN?" }, { ordinal: 1, question: "SYN again?" }]), invalid("asks"));
  const linked = { ...common(), body: "SYN #{1}", mentions: [record(1)], asks: [{ ordinal: 1, question: "SYN?" }] };
  assert.throws(() => postMessageInput(randomUUID(), linked), invalid("asks.0.ordinal"), "a record cannot be asked");
});

test("the other commands take exact versions, positions and steps", () => {
  const id = randomUUID();
  assert.equal(readThroughInput(id, { ...common(), through_sequence: 3 }).through_sequence, 3);
  assert.throws(() => readThroughInput(id, { ...common(), through_sequence: 0 }), invalid("through_sequence"));
  assert.throws(() => readThroughInput("nope", { ...common(), through_sequence: 1 }), invalid("thread_id"));
  assert.equal(threadStateInput(id, { ...common(), expected_version: 2 }).expected_version, 2);
  assert.throws(() => threadStateInput(id, { ...common(), expected_version: 0 }), invalid("expected_version"));
  assert.equal(closeAskInput(id, { ...common(), expected_version: 1 }).ask_id, id);
  assert.throws(() => closeAskInput(id, { ...common() }), invalid("expected_version"));
  assert.equal(askDeadlineInput(id, { ...common(), step: "TellAsker" }).step, "TellAsker");
  assert.throws(() => askDeadlineInput(id, { ...common(), step: "Escalate" }), invalid("step"));
});

test("a thread list is a bounded sidebar or one record's list", () => {
  assert.deepEqual(listInput({}), { filter: "All", anchor: null, limit: 100 });
  const anchor = randomUUID();
  assert.deepEqual(listInput({ filter: "Mentions", anchor_type: "Project", anchor_id: anchor, limit: 5 }), {
    filter: "Mentions",
    anchor: { type: "Project", id: anchor },
    limit: 5,
  });
  assert.throws(() => listInput({ filter: "Everything" }), invalid("filter"));
  assert.throws(() => listInput({ limit: 201 }), invalid("limit"));
  assert.throws(() => listInput({ anchor_type: "Project" }), invalid("anchor_id"));
});
