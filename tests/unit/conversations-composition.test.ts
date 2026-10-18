import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyDraft,
  insertMention,
  reconcile,
  segments,
  toMessageInput,
  visibleToken,
  type Draft,
  type DraftMention,
  type DrawnMention,
} from "../../src/conversations/composition";
import { deriveTitle } from "../../src/conversations/title";

const sam: DraftMention = { key: "p1", kind: "Person", person_id: "00000000-0000-4000-8000-0000000000a1", display_name: "Sam" };
const priya: DraftMention = { key: "p2", kind: "Person", person_id: "00000000-0000-4000-8000-0000000000a2", display_name: "Priya" };
const deal: DraftMention = {
  key: "r1",
  kind: "Record",
  record_type: "Opportunity",
  record_id: "00000000-0000-4000-8000-0000000000b1",
  label: "OPP-0142 · Green Valley Nursery",
};

// Builds a draft by typing text and inserting tags at the end, the way the composer does.
function typed(parts: (string | DraftMention)[]): Draft {
  let d = emptyDraft();
  for (const part of parts) {
    if (typeof part === "string") d = { ...d, text: d.text + part };
    else d = insertMention(d, part, d.text.length).draft;
  }
  return d;
}

test("toMessageInput turns tags into ordered tokens", () => {
  const d = typed([sam, "see ", deal, "today"]);
  assert.equal(d.text, "@Sam see #OPP-0142 · Green Valley Nursery today");
  const r = toMessageInput(d);
  assert.ok(r.ok);
  assert.equal(r.body, "@{1} see #{2} today");
  assert.deepEqual(r.mentions, [
    { ordinal: 1, kind: "Person", person_id: sam.kind === "Person" ? sam.person_id : "" },
    { ordinal: 2, kind: "Record", record_type: "Opportunity", record_id: "00000000-0000-4000-8000-0000000000b1" },
  ]);
  assert.deepEqual(r.asks, []);
});

test("ordinals follow the text, not the order tags were picked", () => {
  let d = { ...emptyDraft(), text: " and " };
  d = insertMention(d, deal, d.text.length).draft;
  d = insertMention(d, sam, 0).draft;
  const r = toMessageInput(d);
  assert.ok(r.ok);
  assert.equal(r.mentions[0].kind, "Person");
  assert.equal(r.mentions[0].ordinal, 1);
  assert.equal(r.mentions[1].kind, "Record");
  assert.equal(r.mentions[1].ordinal, 2);
  assert.match(r.body, /^@\{1\} +and #\{2\}/);
});

test("an ask is sent only when switched on, against the person's first ordinal", () => {
  const d = typed([sam, "and ", priya, "when is it due?"]);
  const asks = d.asks.map((a) =>
    a.person_id === (sam as { person_id: string }).person_id
      ? { ...a, on: true, question: "  delivery date  ", reply_by: "2026-10-30" }
      : { ...a, on: false, question: "ignored" },
  );
  const r = toMessageInput({ ...d, asks });
  assert.ok(r.ok);
  assert.deepEqual(r.asks, [{ ordinal: 1, question: "delivery date", reply_by: "2026-10-30" }]);
});

test("an ask switched on without a question is a local error", () => {
  const d = typed([sam, "hello"]);
  const r = toMessageInput({ ...d, asks: d.asks.map((a) => ({ ...a, on: true, question: "  " })) });
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.field, "asks");
});

test("typed reserved patterns are refused locally", () => {
  const at = toMessageInput({ ...emptyDraft(), text: "see @{1} now" });
  assert.deepEqual(at, { ok: false, field: "body", message: "Remove @{1}: that pattern is reserved for tags." });
  const hash = toMessageInput({ ...emptyDraft(), text: "see #{2} now" });
  assert.deepEqual(hash, { ok: false, field: "body", message: "Remove #{2}: that pattern is reserved for tags." });
});

test("the same person tagged twice keeps one ask row", () => {
  const d = typed([sam, "and again ", sam, "?"]);
  assert.equal(d.asks.length, 1);
  const r = toMessageInput({ ...d, asks: d.asks.map((a) => ({ ...a, on: true, question: "date" })) });
  assert.ok(r.ok);
  assert.equal(r.mentions.filter((m) => m.kind === "Person").length, 2);
  assert.equal(r.asks.length, 1);
  assert.equal(r.asks[0].ordinal, 1);
});

test("deleting a tag's text removes the mention and its ask", () => {
  const d = typed([sam, "and ", priya, "hello"]);
  const edited = reconcile({ ...d, text: d.text.replace(visibleToken(sam), "") });
  assert.equal(edited.mentions.some((m) => m.key === sam.key), false);
  assert.equal(edited.asks.some((a) => a.person_id === (sam as { person_id: string }).person_id), false);
  assert.equal(edited.mentions.some((m) => m.key === priya.key), true);
});

test("limits are enforced locally", () => {
  let many = emptyDraft();
  for (let i = 0; i < 21; i++)
    many = insertMention(many, { ...deal, key: `r${i}`, record_id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}` }, many.text.length).draft;
  const tooMany = toMessageInput(many);
  assert.equal(tooMany.ok, false);
  assert.equal(!tooMany.ok && tooMany.field, "body");

  let people = emptyDraft();
  for (let i = 0; i < 11; i++)
    people = insertMention(
      people,
      { key: `p${i}`, kind: "Person", person_id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, display_name: `Person ${i}` },
      people.text.length,
    ).draft;
  const asked = toMessageInput({ ...people, asks: people.asks.map((a) => ({ ...a, on: true, question: "q" })) });
  assert.equal(asked.ok, false);
  assert.equal(!asked.ok && asked.field, "asks");
});

test("segments draws names and record mentions", () => {
  const hidden: DrawnMention = { ordinal: 2, kind: "Record", can_open: false };
  const drawn: DrawnMention[] = [{ ordinal: 1, kind: "Person", person_id: "x", display_name: "Sam" }, hidden];
  assert.deepEqual(segments("@{1} see #{2}", drawn), [
    { kind: "person", name: "Sam" },
    { kind: "text", text: " see " },
    { kind: "record", mention: hidden },
  ]);
});

test("deriveTitle takes the first sentence without record links", () => {
  const d = typed([sam, "where is ", deal, "at? Customer asked."]);
  assert.equal(deriveTitle(d, "OPP-0142"), "Sam where is at?");
});

test("deriveTitle caps at 80 characters on a word boundary", () => {
  const sentence = Array(24).fill("abcd").join(" ") + "?";
  assert.equal(sentence.length, 120);
  const title = deriveTitle({ ...emptyDraft(), text: sentence }, "OPP-0142");
  assert.ok(title.length <= 80, `length ${title.length}`);
  assert.ok(title.endsWith("…"));
  assert.match(title, /^(abcd )*abcd…$/);
});

test("deriveTitle falls back when nothing is left", () => {
  const d = typed([deal]);
  assert.equal(deriveTitle(d, "OPP-0142"), "Conversation on OPP-0142");
});
