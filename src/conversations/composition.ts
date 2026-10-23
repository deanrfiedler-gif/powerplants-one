// Conversations T1c-1 (PPO-CONV-T1C-DESIGN 5.4). The composer keeps what the person sees: names and record labels in
// plain text, with each picked tag tracked beside it. Only at send time does the text become the stored body, where
// `@{n}` and `#{n}` stand for mention n (T1-5), so a name or record title is never written into a message.
import { maxAsks, maxMentions, type AnchorType, type AskInput, type MentionInput } from "./model";
import { agentName } from "../assistant/model";

export type DraftMention =
  | { key: string; kind: "Agent" }
  | { key: string; kind: "Person"; person_id: string; display_name: string }
  | {
      key: string;
      kind: "Record";
      record_type: AnchorType;
      record_id: string;
      label: string;
    };
// A tag is a picked mention and where its visible text starts. Tags are atomic: an edit that touches one removes all of
// it, so a record label or a name never survives as plain text that looks like a tag (T1-4, T1-5).
export type Tag = DraftMention & { at: number };
export type DraftAsk = {
  person_id: string;
  on: boolean;
  question: string;
  reply_by: string | null;
};
export type Draft = { text: string; mentions: Tag[]; asks: DraftAsk[] };

export type DrawnMention =
  | { ordinal: number; kind: "Agent"; display_name: string }
  | { ordinal: number; kind: "Person"; person_id: string; display_name: string }
  | {
      ordinal: number;
      kind: "Record";
      can_open: true;
      record_type: AnchorType;
      record_id: string;
      display_number: string;
      title: string;
    }
  | { ordinal: number; kind: "Record"; can_open: false };
export type Segment =
  | { kind: "text"; text: string }
  | { kind: "person"; name: string }
  | { kind: "agent"; name: string }
  | { kind: "record"; mention: DrawnMention };

export type MessageInput =
  | { ok: true; body: string; mentions: MentionInput[]; asks: AskInput[] }
  | { ok: false; field: "body" | "asks"; message: string };

export const emptyDraft = (): Draft => ({ text: "", mentions: [], asks: [] });

export const visibleToken = (m: DraftMention) =>
  m.kind === "Agent"
    ? `@${agentName}`
    : m.kind === "Person"
      ? `@${m.display_name}`
      : `#${m.label}`;
const tagEnd = (t: Tag) => t.at + visibleToken(t).length;
const byPosition = (a: Tag, b: Tag) => a.at - b.at;
const withAsks = (text: string, mentions: Tag[], asks: DraftAsk[]): Draft => {
  const people = new Set(mentions.flatMap((m) => (m.kind === "Person" ? [m.person_id] : [])));
  return { text, mentions, asks: asks.filter((a) => people.has(a.person_id)) };
};

// The composer reports each change as the whole new text. The change is the span between the longest common prefix and
// suffix; a tag that span touches is removed entirely, and the caret lands where the edit ended.
export function applyEdit(
  d: Draft,
  next: string,
): { draft: Draft; caret: number } {
  const prev = d.text;
  const shortest = Math.min(prev.length, next.length);
  let p = 0;
  while (p < shortest && prev[p] === next[p]) p++;
  let s = 0;
  while (s < shortest - p && prev[prev.length - 1 - s] === next[next.length - 1 - s]) s++;
  const removedEnd = prev.length - s;
  const insertedEnd = next.length - s;
  const delta = insertedEnd - removedEnd;
  const touched = (t: Tag) => {
    const e = tagEnd(t);
    return (
      (p < e && removedEnd > t.at && removedEnd > p) || (t.at < p && p < e)
    );
  };
  const cuts: [number, number][] = [];
  const kept: Tag[] = [];
  for (const t of d.mentions) {
    const e = tagEnd(t);
    if (!touched(t)) {
      kept.push(t);
      continue;
    }
    if (t.at < p) cuts.push([t.at, Math.min(p, e)]);
    if (e > removedEnd) cuts.push([Math.max(removedEnd, t.at) + delta, e + delta]);
  }
  cuts.sort((x, y) => y[0] - x[0]);
  let text = next;
  for (const [from, to] of cuts) text = text.slice(0, from) + text.slice(to);
  const cutBefore = (position: number) =>
    cuts.reduce((sum, [from, to]) => sum + (to <= position ? to - from : 0), 0);
  const mentions = kept
    .map((t) =>
      tagEnd(t) <= p ? t : { ...t, at: t.at + delta - cutBefore(t.at + delta) },
    )
    .sort(byPosition);
  return { draft: withAsks(text, mentions, d.asks), caret: insertedEnd - cutBefore(insertedEnd) };
}

// Inserts a tag and one space at the caret. `replace` first removes that many characters before the caret: the `@` or
// `#` the person typed to open the picker. A caret inside a tag moves to the end of that tag.
export function insertMention(
  d: Draft,
  m: DraftMention,
  caret: number,
  replace = 0,
) {
  if (m.kind === "Agent" && d.mentions.some((t) => t.kind === "Agent"))
    return { draft: d, caret };
  let base = d;
  let at = Math.max(0, Math.min(caret, d.text.length));
  if (replace > 0) {
    const from = Math.max(0, at - replace);
    const edited = applyEdit(d, d.text.slice(0, from) + d.text.slice(at));
    base = edited.draft;
    at = edited.caret;
  }
  const inside = base.mentions.find((t) => t.at < at && at < tagEnd(t));
  const pos = inside ? tagEnd(inside) : at;
  const insert = `${visibleToken(m)} `;
  const mentions = [
    ...base.mentions.map((t) =>
      t.at >= pos ? { ...t, at: t.at + insert.length } : t,
    ),
    { ...m, at: pos },
  ].sort(byPosition);
  const asks =
    m.kind === "Person" && !base.asks.some((a) => a.person_id === m.person_id)
      ? [...base.asks, { person_id: m.person_id, on: false, question: "", reply_by: null }]
      : base.asks;
  return { draft: { text: base.text.slice(0, pos) + insert + base.text.slice(pos), mentions, asks }, caret: pos + insert.length };
}

const reserved = /[@#]\{\d+\}/;

export function toMessageInput(d: Draft): MessageInput {
  const tags = [...d.mentions].sort(byPosition);
  if (tags.filter((t) => t.kind === "Agent").length > 1)
    return {
      ok: false,
      field: "body",
      message: "Tag the assistant at most once in a message.",
    };
  let from = 0;
  for (const t of tags) {
    if (d.text.slice(t.at, tagEnd(t)) !== visibleToken(t))
      return { ok: false, field: "body", message: "A tag no longer matches its text. Remove it and tag again." };
    const typed = reserved.exec(d.text.slice(from, t.at));
    if (typed)
      return {
        ok: false,
        field: "body",
        message: `Remove ${typed[0]}: that pattern is reserved for tags.`,
      };
    from = tagEnd(t);
  }
  const typedTail = reserved.exec(d.text.slice(from));
  if (typedTail)
    return {
      ok: false,
      field: "body",
      message: `Remove ${typedTail[0]}: that pattern is reserved for tags.`,
    };
  if (tags.length > maxMentions)
    return {
      ok: false,
      field: "body",
      message: `Tag at most ${maxMentions} people and records in one message.`,
    };
  let body = "";
  let cursor = 0;
  const mentions: MentionInput[] = [];
  const firstOrdinal = new Map<string, number>();
  tags.forEach((t, index) => {
    const ordinal = index + 1;
    body +=
      d.text.slice(cursor, t.at) +
      (t.kind === "Record" ? `#{${ordinal}}` : `@{${ordinal}}`);
    cursor = tagEnd(t);
    if (t.kind === "Person") {
      mentions.push({ ordinal, kind: "Person", person_id: t.person_id });
      if (!firstOrdinal.has(t.person_id)) firstOrdinal.set(t.person_id, ordinal);
    } else if (t.kind === "Agent") mentions.push({ ordinal, kind: "Agent" });
    else mentions.push({ ordinal, kind: "Record", record_type: t.record_type, record_id: t.record_id });
  });
  body += d.text.slice(cursor);
  const on = d.asks.filter((a) => a.on && firstOrdinal.has(a.person_id));
  if (on.length > maxAsks)
    return {
      ok: false,
      field: "asks",
      message: `Ask at most ${maxAsks} people in one message.`,
    };
  const asks: AskInput[] = [];
  for (const a of on) {
    const question = a.question.trim();
    if (!question) return { ok: false, field: "asks", message: "Write the question for each person you ask." };
    asks.push({ ordinal: firstOrdinal.get(a.person_id)!, question, reply_by: a.reply_by });
  }
  return { ok: true, body, mentions, asks };
}

// Draws a stored body for one reader from the mentions the server drew from that reader's own access (T1-4).
export function segments(body: string, mentions: DrawnMention[]): Segment[] {
  const byOrdinal = new Map(mentions.map((m) => [m.ordinal, m]));
  const out: Segment[] = [];
  let from = 0;
  for (const match of body.matchAll(/([@#])\{(\d+)\}/g)) {
    const mention = byOrdinal.get(Number(match[2]));
    if (!mention) continue;
    if (match.index > from) out.push({ kind: "text", text: body.slice(from, match.index) });
    out.push(
      mention.kind === "Agent"
        ? { kind: "agent", name: mention.display_name }
        : mention.kind === "Person"
          ? { kind: "person", name: mention.display_name }
          : { kind: "record", mention },
    );
    from = match.index + match[0].length;
  }
  if (from < body.length) out.push({ kind: "text", text: body.slice(from) });
  return out;
}
