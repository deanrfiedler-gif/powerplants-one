// PPO-CONV-T1C-DESIGN 5.5: a new thread's title comes from the first sentence of its first message. A thread title is
// shown to everyone in the thread, so record links are dropped: a linked record's number or title must not reach
// readers who cannot open that record (T1-4). People keep their names. Tags are replaced by position, never by
// searching for their text.
import { visibleToken, type Draft } from "./composition";

const maxLength = 80;

export function deriveTitle(d: Draft, anchorNumber: string): string {
  let text = d.text;
  for (const t of [...d.mentions].sort((a, b) => b.at - a.at))
    text = text.slice(0, t.at) + (t.kind === "Person" ? t.display_name : "") + text.slice(t.at + visibleToken(t).length);
  text = text.replace(/[ \t]+/g, " ");
  const sentence = /^[\s\S]*?(?:[.?!](?=\s|$)|\n|$)/.exec(text.trim())?.[0].trim() ?? "";
  const clean = sentence.replace(/\s+/g, " ").replace(/\s+([.?!,;:])/g, "$1").trim();
  if (!clean) return `Conversation on ${anchorNumber}`;
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
