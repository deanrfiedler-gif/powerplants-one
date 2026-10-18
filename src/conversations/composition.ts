// Conversations T1c-1 (PPO-CONV-T1C-DESIGN 5.4). The composer keeps what the person sees: names and record labels in
// plain text, with each picked tag tracked beside it. Only at send time does the text become the stored body, where
// `@{n}` and `#{n}` stand for mention n (T1-5), so a name or record title is never written into a message.
import { maxAsks, maxMentions, type AnchorType, type AskInput, type MentionInput } from "./model";

export type DraftMention =
  | { key: string; kind: "Person"; person_id: string; display_name: string }
  | { key: string; kind: "Record"; record_type: AnchorType; record_id: string; label: string };
export type DraftAsk = { person_id: string; on: boolean; question: string; reply_by: string | null };
export type Draft = { text: string; mentions: DraftMention[]; asks: DraftAsk[] };

export type DrawnMention =
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
  | { kind: "record"; mention: DrawnMention };

export type MessageInput =
  | { ok: true; body: string; mentions: MentionInput[]; asks: AskInput[] }
  | { ok: false; field: "body" | "asks"; message: string };

export const emptyDraft = (): Draft => ({ text: "", mentions: [], asks: [] });

export const visibleToken = (m: DraftMention) =>
  m.kind === "Person" ? `@${m.display_name}` : `#${m.label}`;

export function insertMention(d: Draft, m: DraftMention, caret: number) {
  const at = Math.max(0, Math.min(caret, d.text.length));
  const insert = `${visibleToken(m)} `;
  const asks =
    m.kind === "Person" && !d.asks.some((a) => a.person_id === m.person_id)
      ? [...d.asks, { person_id: m.person_id, on: false, question: "", reply_by: null }]
      : d.asks;
  return {
    draft: { text: d.text.slice(0, at) + insert + d.text.slice(at), mentions: [...d.mentions, m], asks },
    caret: at + insert.length,
  };
}

const occurrences = (text: string, token: string) => {
  let count = 0;
  for (let i = text.indexOf(token); i >= 0; i = text.indexOf(token, i + token.length)) count++;
  return count;
};

// A tag lasts while its visible text does. Where several tags share one token, as many survive as the text still
// holds copies, the earliest picked first.
export function reconcile(d: Draft): Draft {
  const used = new Map<string, number>();
  const mentions = d.mentions.filter((m) => {
    const token = visibleToken(m);
    const n = (used.get(token) ?? 0) + 1;
    used.set(token, n);
    return n <= occurrences(d.text, token);
  });
  const people = new Set(mentions.flatMap((m) => (m.kind === "Person" ? [m.person_id] : [])));
  return { text: d.text, mentions, asks: d.asks.filter((a) => people.has(a.person_id)) };
}

const reserved = /[@#]\{\d+\}/;

export function toMessageInput(d: Draft): MessageInput {
  const typedToken = reserved.exec(d.text);
  if (typedToken)
    return { ok: false, field: "body", message: `Remove ${typedToken[0]}: that pattern is reserved for tags.` };
  const current = reconcile(d);
  if (current.mentions.length > maxMentions)
    return { ok: false, field: "body", message: `Tag at most ${maxMentions} people and records in one message.` };
  // Place every tag on the first copy of its token not already taken, then number them in the order they appear.
  const taken = new Set<number>();
  const placed = current.mentions.map((m) => {
    const token = visibleToken(m);
    let at = current.text.indexOf(token);
    while (at >= 0 && taken.has(at)) at = current.text.indexOf(token, at + token.length);
    taken.add(at);
    return { m, at, length: token.length };
  });
  placed.sort((a, b) => a.at - b.at);
  let body = "";
  let from = 0;
  const mentions: MentionInput[] = [];
  const firstOrdinal = new Map<string, number>();
  placed.forEach(({ m, at, length }, index) => {
    const ordinal = index + 1;
    body += current.text.slice(from, at) + (m.kind === "Person" ? `@{${ordinal}}` : `#{${ordinal}}`);
    from = at + length;
    if (m.kind === "Person") {
      mentions.push({ ordinal, kind: "Person", person_id: m.person_id });
      if (!firstOrdinal.has(m.person_id)) firstOrdinal.set(m.person_id, ordinal);
    } else mentions.push({ ordinal, kind: "Record", record_type: m.record_type, record_id: m.record_id });
  });
  body += current.text.slice(from);
  const on = current.asks.filter((a) => a.on);
  if (on.length > maxAsks) return { ok: false, field: "asks", message: `Ask at most ${maxAsks} people in one message.` };
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
    out.push(mention.kind === "Person" ? { kind: "person", name: mention.display_name } : { kind: "record", mention });
    from = match.index + match[0].length;
  }
  if (from < body.length) out.push({ kind: "text", text: body.slice(from) });
  return out;
}
