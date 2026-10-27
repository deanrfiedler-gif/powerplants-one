// ADR-0065: this module is the only importer of marked and yaml. Everything else reads PPO's own guide model.
import { createHash } from "node:crypto";
import { Lexer, type MarkedToken, type Token, type Tokens } from "marked";
import { LineCounter, isMap, isScalar, parseDocument, visit } from "yaml";
import { linkShape } from "./links";
import { hasVisibleText } from "./status";
import {
  guideStatuses,
  maxNesting,
  type BlockNode,
  type CompiledGuide,
  type GuideError,
  type GuideFrontMatter,
  type GuideSection,
  type InlineNode,
} from "./model";

export type FrontMatterRead = {
  front?: GuideFrontMatter;
  body: string; // everything after the closing --- line, with LF line endings
  bodyLine: number; // 1-based file line of the first body line
  errors: GuideError[];
};

const requiredTextKeys = ["guide_key", "entry_key", "title", "owner_role", "source_commit"];
const knownKeys = new Set([
  ...requiredTextKeys,
  "versioning",
  "status",
  "also_applies_to",
  "carried_over_from",
  "shown_before_review",
  "contents",
  "list_styles",
  "document_id",
  "issued_revision",
  "audience",
  "reviewer",
  "reviewed_at",
  "reviewed_content_hash",
  "review_due_at",
  "workflow_basis",
  "runtime_evidence",
  "resource_ids",
  "supersedes",
  "section_aliases",
  "change_summary",
]);
// The page guide template's route keys, replaced by the binding keys.
const replacedKeys = new Set(["route_patterns", "entry_sections"]);

type Report = (key: string, message: string) => void;

export function readFrontMatter(path: string, text: string): FrontMatterRead {
  // marked reads a lone CR as a line break as well as CRLF, so both become LF before anything counts lines.
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const closing = lines[0] === "---" ? lines.indexOf("---", 1) : -1;
  if (closing < 0) {
    const message =
      lines[0] === "---"
        ? "The front matter is not closed: add a line of --- after the last key."
        : "The file must start with front matter: a line of ---, the keys, then another line of ---.";
    return { body: lines.join("\n"), bodyLine: 1, errors: [{ path, line: 1, message }] };
  }

  const errors: GuideError[] = [];
  const read = (front?: GuideFrontMatter): FrontMatterRead => ({
    front: errors.length === 0 ? front : undefined,
    body: lines.slice(closing + 1).join("\n"),
    bodyLine: closing + 2,
    errors: errors.sort((a, b) => a.line - b.line),
  });

  // The YAML starts on file line 2, so a yaml line number is one short of the file line.
  const lineCounter = new LineCounter();
  const doc = parseDocument(lines.slice(1, closing).join("\n"), { schema: "core", uniqueKeys: true, lineCounter });
  const fileLine = (offset: number) => lineCounter.linePos(offset).line + 1;

  // yaml reports an unknown tag such as !!js/function only as a warning, so warnings are refusals too.
  for (const problem of [...doc.errors, ...doc.warnings]) {
    const reason = problem.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, "");
    errors.push({ path, line: fileLine(problem.pos[0]), message: `Front matter YAML: ${reason}.` });
  }
  if (errors.length > 0) return read();

  if (!isMap(doc.contents)) {
    const line = doc.contents?.range ? fileLine(doc.contents.range[0]) : 1;
    errors.push({ path, line, message: "The front matter must be a list of keys with values, written key: value." });
    return read();
  }

  let data: unknown;
  try {
    data = doc.toJS({ maxAliasCount: 0 });
  } catch (error) {
    let alias: number | undefined;
    visit(doc, {
      Alias: (_key, node) => {
        alias = node.range?.[0];
        return visit.BREAK;
      },
    });
    const message =
      alias === undefined
        ? `The front matter could not be read: ${error instanceof Error ? error.message : String(error)}`
        : "YAML aliases (*name) are not allowed in front matter: write the value out in full.";
    errors.push({ path, line: alias === undefined ? 2 : fileLine(alias), message });
    return read();
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    errors.push({ path, line: 2, message: "The front matter must be a list of keys with values, written key: value." });
    return read();
  }

  const keyLines = new Map<string, number>();
  for (const pair of doc.contents.items) {
    if (isScalar(pair.key) && pair.key.range) keyLines.set(String(pair.key.value), fileLine(pair.key.range[0]));
  }
  // A key that is not on a line of its own (a missing required key) is reported against the opening ---.
  const report: Report = (key, message) => errors.push({ path, line: keyLines.get(key) ?? 1, message });
  return read(validate(new Map(Object.entries(data)), report));
}

// Whether a file's front matter declares a guide key, in any form YAML reads: a block or flow mapping, after comment
// lines, or with a quoted or escaped key. The library uses this to find guides outside docs/guides/pages. Front matter
// that YAML cannot read, or with a key that is not plain text, counts when any of its lines names a guide key, so the
// compiler reports it instead of the file dropping out of the library.
export function declaresGuideKey(text: string): boolean {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0] !== "---") return false;
  const closing = lines.indexOf("---", 1);
  const block = lines.slice(1, closing < 0 ? undefined : closing);
  const doc = parseDocument(block.join("\n"), { schema: "core", uniqueKeys: true });
  if (doc.errors.length === 0 && isMap(doc.contents)) {
    return doc.contents.items.some((pair) => !isScalar(pair.key) || /^\s*guide[_-]key\s*$/i.test(String(pair.key.value)));
  }
  return block.some((line) => /guide[_-]key/i.test(line));
}

// Always returns a well-typed object so that no cast is needed. The caller discards it when anything was reported.
function validate(fields: Map<string, unknown>, report: Report): GuideFrontMatter {
  const field = (key: string): unknown => fields.get(key);

  for (const key of fields.keys()) {
    if (replacedKeys.has(key)) report(key, `"${key}" is no longer a front matter key: use entry_key and also_applies_to.`);
    else if (!knownKeys.has(key)) report(key, `"${key}" is not a front matter key.`);
  }

  const requiredText = (key: string): string => {
    const value = field(key);
    if (typeof value === "string" && value.trim() !== "") return value;
    report(
      key,
      value === undefined
        ? `"${key}" is required.`
        : `"${key}" must be text that is not empty. Put the value in quotes if it looks like a number or a date.`,
    );
    return "";
  };
  const optionalText = (key: string): string | null => {
    const value = field(key);
    if (value === undefined || value === null) return null;
    if (typeof value === "string") return value;
    report(key, `"${key}" must be text or null.`);
    return null;
  };
  const optionalDate = (key: string): string | null => {
    const value = optionalText(key);
    if (value === null || isCalendarDate(value)) return value;
    report(key, `"${key}" must be a real date written YYYY-MM-DD, such as 2026-10-23.`);
    return null;
  };
  const textList = (key: string): string[] => {
    const value = field(key);
    if (value === undefined) return [];
    if (Array.isArray(value) && value.every((item): item is string => typeof item === "string")) return value;
    report(key, `"${key}" must be a list of text values.`);
    return [];
  };
  const textMap = (key: string): Record<string, string> => {
    const value = field(key);
    if (value === undefined) return {};
    const entries = stringEntries(value);
    if (entries) return Object.fromEntries(entries);
    report(key, `"${key}" must pair each section id with text.`);
    return {};
  };

  const versioning = field("versioning");
  if (versioning === undefined) report("versioning", '"versioning" is required.');
  else if (versioning !== "git") report("versioning", '"versioning" must be git: a guide\'s history is its Git history, not a revision label.');

  const statusValue = field("status");
  const status = guideStatuses.find((candidate) => candidate === statusValue);
  if (statusValue === undefined) report("status", '"status" is required.');
  else if (!status) report("status", `"status" must be one of ${guideStatuses.slice(0, -1).join(", ")} or ${guideStatuses[guideStatuses.length - 1]}.`);

  const listStyleValue = field("list_styles");
  let listStyles: Record<string, "journey"> = {};
  if (listStyleValue !== undefined) {
    const entries = stringEntries(listStyleValue);
    if (entries?.every(([, style]) => style === "journey")) listStyles = Object.fromEntries(entries.map(([id]) => [id, "journey" as const]));
    else report("list_styles", '"list_styles" must pair each section id with journey.');
  }

  // A contents label is the text of its section's button, so it cannot be blank.
  const contents = textMap("contents");
  for (const [id, label] of Object.entries(contents)) {
    if (label.trim() === "") report("contents", `"contents" gives the section "${id}" an empty label: write the text its button shows.`);
  }

  const shownValue = field("shown_before_review");
  if (shownValue !== undefined && typeof shownValue !== "boolean") report("shown_before_review", '"shown_before_review" must be true or false.');
  const shownBeforeReview = shownValue === true;
  // A reviewer is review evidence, so a name a reader cannot see is refused rather than kept.
  const reviewer = optionalText("reviewer");
  if (reviewer !== null && !hasVisibleText(reviewer)) report("reviewer", '"reviewer" must name the reviewer, or be left out until the review.');
  const carriedOverFrom = optionalText("carried_over_from");
  if (shownBeforeReview && (carriedOverFrom === null || carriedOverFrom.trim() === "")) {
    report("shown_before_review", '"shown_before_review" is true, so "carried_over_from" must name the source this guide was carried over from.');
  }

  return {
    guide_key: requiredText("guide_key"),
    entry_key: requiredText("entry_key"),
    also_applies_to: textList("also_applies_to"),
    carried_over_from: carriedOverFrom,
    shown_before_review: shownBeforeReview,
    contents,
    list_styles: listStyles,
    document_id: optionalText("document_id"),
    title: requiredText("title"),
    versioning: "git",
    status: status ?? "Draft",
    issued_revision: optionalText("issued_revision"),
    audience: optionalText("audience"),
    owner_role: requiredText("owner_role"),
    reviewer,
    reviewed_at: optionalDate("reviewed_at"),
    reviewed_content_hash: optionalText("reviewed_content_hash"),
    review_due_at: optionalDate("review_due_at"),
    source_commit: requiredText("source_commit"),
    workflow_basis: optionalText("workflow_basis"),
    runtime_evidence: optionalText("runtime_evidence"),
    resource_ids: textList("resource_ids"),
    supersedes: optionalText("supersedes"),
    section_aliases: textMap("section_aliases"),
    change_summary: optionalText("change_summary"),
  };
}

// Object.entries when the value is a mapping whose every value is text. Object.fromEntries defines own properties,
// so a section id of __proto__ cannot reach the prototype.
function stringEntries(value: unknown): [string, string][] | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const entries = Object.entries(value);
  const strings = entries.filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return strings.length === entries.length ? strings : undefined;
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// The body compiler (ADR-0065, decisions 3 to 6). marked's lexer turns the body into a token tree, and the walk
// below maps an allowlist of token types onto PPO's model. Every other construct is refused with its own file line,
// never dropped. Only the lexer is used: nothing here renders Markdown or produces HTML.

type BodyCompile = Pick<CompiledGuide, "lead" | "sections" | "references"> & { errors: GuideError[] };
// `top` is true outside lists and callouts, where headings may sit.
type Place = { top: boolean; callout: boolean };

const sectionIdShape = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const sectionIdSuffix = /\s*\{#([^{}]*)\}$/;
const anyIdSuffix = /\{#[^{}]*\}\s*$/;
const calloutMarker = /^\[!(NOTE|WARNING|IMPORTANT)\]\s*\n?/;
// ADR-0065, decision 5: the marker stands alone on the quote's first line. This is tested on the raw paragraph text,
// which keeps its line breaks; the compiled text has turned them into spaces, so it is used only to strip the marker.
const calloutLine = /^\[!(NOTE|WARNING|IMPORTANT)\][ \t]*(?:\n|$)/;
const footnoteText = /\[\^[^\]]+\]/g;
const footnoteLink = /^\[\^[^\]]+\]/;
// marked decodes numeric references in text (&#169; becomes ©) but leaves named ones (&amp;) and link targets
// as typed, while GitHub decodes all of them. A guide uses the character itself, so the source reads as shown.
const characterReference = /&(?:#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{0,31});/g;
const definitionLine = /^ {0,3}\[[^\]]+\]:/;
const atxHeadingStart = /^ {0,3}#{1,6}(?:[ \t]|$)/;
const softBreak = /[ \t]*\n[ \t]*/g;

const refusals = {
  html: "Raw HTML is not allowed in a guide: write the content in Markdown instead.",
  comment: "HTML comments are not allowed in a guide: remove the comment, or put the note in the pull request.",
  code: "Code blocks are not allowed in a guide: use inline code, such as `Ctrl+K`, for keys and short values.",
  indentedCode: "Indented code blocks are not allowed in a guide: a line indented by four or more spaces becomes code, so remove the indent.",
  rule: "Horizontal rules (---, *** or ___ on a line of their own) are not allowed in a guide: start a new ## section instead.",
  setext: "A heading underlined with = or - is not allowed in a guide: write ## Title {#section-id} or ### Title instead.",
  definition: "Reference link definitions ([label]: target) are not allowed in a guide: write each link in full, as [text](target).",
  footnote: "Footnotes ([^…]) are not allowed in a guide: put the note in the text.",
  image: "Images are not allowed in a guide until the private image store exists.",
  strikethrough: "Strikethrough (~~text~~) is not allowed in a guide.",
  checkbox: "Task list checkboxes ([ ] and [x]) are not allowed in a guide.",
  plainQuote: "A quote must be a callout: start it with [!NOTE], [!WARNING] or [!IMPORTANT] on its first line.",
  nestedQuote: "A callout cannot contain another quote.",
  emptyCallout: "The callout has no text after its marker.",
  titleHeading: "A # heading is not allowed in a guide: the title comes from the front matter, so use ## for a section.",
  nestedHeading: "A heading cannot sit inside a list or a callout: put it on a line of its own, outside them.",
  subheadingId: "Section ids belong to ## headings only: remove the {#…} from this ### heading.",
  emptySubheading: "A ### heading needs text: write the sub-heading, or remove the line.",
  missingId: "A ## heading must end with its section id as plain text, such as ## How to use it {#how-to-use}.",
  missingTitle: "A ## heading needs a title before its section id.",
};

// The text a reader sees in inline nodes. A heading whose visible text is blank would have no accessible name.
function visibleText(nodes: InlineNode[]): string {
  return nodes.map((node) => (node.kind === "text" || node.kind === "code" ? node.text : node.kind === "break" ? " " : visibleText(node.children))).join("");
}

// Compiles one guide file. Front matter and body problems are reported together, so an author sees them all at
// once; the guide is returned only when there are none.
export function compileGuide(path: string, text: string): { guide?: CompiledGuide; errors: GuideError[] } {
  const read = readFrontMatter(path, text);
  // Without a closing ---, the rest of the file is unread front matter rather than a body.
  const unclosed = read.bodyLine === 1 && /^---(?:\n|$)/.test(read.body);
  const body = unclosed ? undefined : compileBody(path, read.body, read.bodyLine);
  const errors = [...read.errors, ...(body?.errors ?? [])].sort((a, b) => a.line - b.line);
  if (!read.front || !body || errors.length > 0) return { errors };
  const { lead, sections, references } = body;
  return { guide: { path, front: read.front, lead, sections, contentHash: contentHash(read.front, read.body), references }, errors };
}

// SHA-256 hex over the reviewed content: the binding keys, the title, the section maps and the LF body. Review
// fields are left out, so recording a review does not change the hash it records.
function contentHash(front: GuideFrontMatter, body: string): string {
  const { guide_key, entry_key, also_applies_to, title, section_aliases, contents, list_styles } = front;
  const content = JSON.stringify({ guide_key, entry_key, also_applies_to, title, section_aliases, contents, list_styles, body });
  return createHash("sha256").update(content).digest("hex");
}

// A token's line is bodyLine plus the line breaks in the raw text before it. Nested tokens count from their
// container's line in the same way: marked strips the > and indents from nested raw text but keeps its line breaks.
const lineBreaks = (raw: string) => raw.split("\n").length - 1;

// marked's heading token also covers headings underlined with = or -, whose raw text spans two lines.
const isAtxHeading = (raw: string) => atxHeadingStart.test(raw) && !raw.replace(/\n+$/, "").includes("\n");

function compileBody(path: string, body: string, bodyLine: number): BodyCompile {
  const errors: GuideError[] = [];
  const references: CompiledGuide["references"] = [];
  const sectionLines = new Map<string, number>();
  const definitionTags = new Set<string>();
  const refuse = (line: number, message: string) => {
    errors.push({ path, line, message });
  };
  // Lists, callouts, bold and italic text and links each count as a level (maxNesting in model.ts). One that would go
  // past the limit is refused on its own line, and nothing inside it is read.
  let depth = 0;
  const nested = <T>(at: number, read: () => T): T | undefined => {
    if (depth >= maxNesting) {
      refuse(at, `Lists, callouts, bold and italic text and links are nested more than ${maxNesting} levels deep here: flatten the list or the formatting.`);
      return undefined;
    }
    depth += 1;
    try {
      return read();
    } finally {
      depth -= 1;
    }
  };

  const tokens = new Lexer({ gfm: true, breaks: false, pedantic: false }).lex(body);
  const lead: BlockNode[] = [];
  const sections: GuideSection[] = [];
  let blocks = lead;
  let line = bodyLine;
  for (const token of tokens) {
    const known = token as MarkedToken; // an unknown type reaches the refusal in block()
    if (known.type === "heading" && known.depth === 2 && isAtxHeading(known.raw)) {
      const section = sectionHeading(known, line);
      sections.push(section);
      blocks = section.blocks;
    } else {
      const node = block(token, line, { top: true, callout: false });
      if (node) blocks.push(node);
    }
    line += lineBreaks(token.raw);
  }

  // marked moves reference definitions into tokens.links. Each one is refused at its own def token above; a
  // definition without a token of its own is found by scanning the body's lines.
  if (Object.keys(tokens.links).some((tag) => !definitionTags.has(tag))) {
    const reported = new Set(errors.filter((error) => error.message === refusals.definition).map((error) => error.line));
    const found = body.split("\n").flatMap((text, index) => (definitionLine.test(text) ? [bodyLine + index] : []));
    for (const at of found.length > 0 ? found : [bodyLine]) if (!reported.has(at)) refuse(at, refusals.definition);
  }

  return { lead, sections, references, errors };

  function blockList(list: Token[], start: number, place: Place): BlockNode[] {
    const nodes: BlockNode[] = [];
    let at = start;
    for (const token of list) {
      const node = block(token, at, place);
      if (node) nodes.push(node);
      at += lineBreaks(token.raw);
    }
    return nodes;
  }

  function block(token: Token, at: number, place: Place): BlockNode | undefined {
    const known = token as MarkedToken; // any other type falls through to the refusal below
    switch (known.type) {
      case "space":
        return undefined;
      case "paragraph":
        return { kind: "paragraph", children: inline(known.tokens, at) };
      case "text":
        // A tight list item holds its text as a block-level text token.
        if (known.tokens) return { kind: "paragraph", children: inline(known.tokens, at) };
        break;
      case "heading":
        return heading(known, at, place);
      case "list":
        return nested(at, () => list(known, at, place));
      case "table":
        // Alignment is not part of the model. The delimiter row follows the header, and each row is one line.
        return {
          kind: "table",
          header: known.header.map((cell) => inline(cell.tokens, at)),
          rows: known.rows.map((row, index) => row.map((cell) => inline(cell.tokens, at + 2 + index))),
        };
      case "blockquote":
        return nested(at, () => callout(known, at, place));
      case "html":
        refuse(at, isComment(known.text) ? refusals.comment : refusals.html);
        return undefined;
      case "code":
        refuse(at, known.codeBlockStyle === "indented" ? refusals.indentedCode : refusals.code);
        return undefined;
      case "hr":
        refuse(at, refusals.rule);
        return undefined;
      case "def":
        definitionTags.add(known.tag);
        refuse(at, refusals.definition);
        return undefined;
      case "checkbox":
        refuse(at, refusals.checkbox);
        return undefined;
    }
    refuse(at, `Markdown of type "${token.type}" is not allowed in a guide.`);
    return undefined;
  }

  function sectionHeading(token: Tokens.Heading, at: number): GuideSection {
    const title = inline(token.tokens, at);
    const last = title.at(-1);
    const match = last?.kind === "text" ? sectionIdSuffix.exec(last.text) : null;
    if (last?.kind !== "text" || !match) {
      refuse(at, refusals.missingId);
      return { id: "", title, blocks: [] };
    }
    const rest = last.text.slice(0, match.index);
    if (rest === "") title.pop();
    else title[title.length - 1] = { kind: "text", text: rest };
    if (visibleText(title).trim() === "") refuse(at, refusals.missingTitle);

    const id = match[1];
    const first = sectionLines.get(id);
    if (!sectionIdShape.test(id)) refuse(at, `The section id "${id}" must use lower-case letters, digits and single hyphens, such as how-to-use.`);
    else if (first !== undefined) refuse(at, `The section id "${id}" is already used on line ${first}.`);
    else sectionLines.set(id, at);
    return { id, title, blocks: [] };
  }

  function heading(token: Tokens.Heading, at: number, place: Place): BlockNode | undefined {
    const children = inline(token.tokens, at);
    if (!isAtxHeading(token.raw)) refuse(at, refusals.setext);
    else if (token.depth === 1) refuse(at, refusals.titleHeading);
    else if (token.depth >= 4) refuse(at, `A ${"#".repeat(token.depth)} heading is not allowed in a guide: use ## for a section or ### for a sub-heading.`);
    else if (!place.top) refuse(at, refusals.nestedHeading);
    else if (token.depth === 3) {
      const last = children.at(-1);
      if (last?.kind === "text" && anyIdSuffix.test(last.text)) refuse(at, refusals.subheadingId);
      else if (visibleText(children).trim() === "") refuse(at, refusals.emptySubheading);
      return { kind: "heading", children };
    }
    return undefined;
  }

  function list(token: Tokens.List, at: number, place: Place): BlockNode {
    // The model has no start number, so a list that starts elsewhere would be renumbered without warning.
    if (token.ordered && token.start !== 1) refuse(at, `An ordered list must start at 1, not ${token.start}: the guide numbers its steps from 1.`);
    const items: BlockNode[][] = [];
    let itemLine = at;
    for (const item of token.items) {
      items.push(blockList(item.tokens, itemLine, { top: false, callout: place.callout }));
      itemLine += lineBreaks(item.raw);
    }
    return { kind: "list", ordered: token.ordered, items };
  }

  function callout(token: Tokens.Blockquote, at: number, place: Place): BlockNode | undefined {
    if (place.callout) {
      refuse(at, refusals.nestedQuote);
      blockList(token.tokens, at, place); // report the problems inside it too
      return undefined;
    }
    const [first] = token.tokens;
    const marker = first?.type === "paragraph" ? calloutLine.exec(first.text) : null;
    const errorsBefore = errors.length;
    // A refused quote is still walked, so the problems inside it are reported too.
    const children = blockList(token.tokens, at, { top: false, callout: true });
    const lead = children[0];
    const head = lead?.kind === "paragraph" ? lead.children[0] : undefined;
    if (!marker || lead?.kind !== "paragraph" || head?.kind !== "text" || !calloutMarker.test(head.text)) {
      refuse(at, refusals.plainQuote);
      return undefined;
    }

    // Strip the marker. Text may follow it on the next line of the same paragraph, or in a separate paragraph.
    const rest = head.text.replace(calloutMarker, "");
    if (rest !== "") lead.children[0] = { kind: "text", text: rest };
    else {
      lead.children.shift();
      if (lead.children[0]?.kind === "break") lead.children.shift();
    }
    if (lead.children.length === 0) children.shift();
    if (children.length === 0 && errors.length === errorsBefore) refuse(at, refusals.emptyCallout);
    const tone = marker[1] === "NOTE" ? "note" : marker[1] === "WARNING" ? "warning" : "important";
    return { kind: "callout", tone, children };
  }

  function inline(list: Token[], start: number): InlineNode[] {
    const nodes: InlineNode[] = [];
    // Adjacent text, escapes included, is checked as one run, so a token boundary cannot hide footnote syntax.
    let run: { text: string; line: number } | undefined;
    const closeRun = () => {
      for (const match of run?.text.matchAll(footnoteText) ?? []) {
        if (run) refuse(run.line + lineBreaks(run.text.slice(0, match.index)), refusals.footnote);
      }
      run = undefined;
    };

    let at = start;
    for (const token of list) {
      const tokenLine = at;
      at += lineBreaks(token.raw);
      const known = token as MarkedToken; // any other type falls through to the refusal below
      if (known.type === "text" || known.type === "escape") {
        for (const reference of known.type === "text" ? known.raw.matchAll(characterReference) : []) {
          const referenceLine = tokenLine + lineBreaks(known.raw.slice(0, reference.index));
          refuse(referenceLine, `"${reference[0]}" is a character reference: type the character itself instead.`);
        }
        run = run ? { text: run.text + known.text, line: run.line } : { text: known.text, line: tokenLine };
        const last = nodes.at(-1);
        if (last?.kind === "text") nodes[nodes.length - 1] = { kind: "text", text: last.text + known.text };
        else if (known.text !== "") nodes.push({ kind: "text", text: known.text });
        continue;
      }
      closeRun();
      switch (known.type) {
        case "strong": {
          const children = nested(tokenLine, () => inline(known.tokens, tokenLine));
          if (children) nodes.push({ kind: "strong", children });
          continue;
        }
        case "em": {
          const children = nested(tokenLine, () => inline(known.tokens, tokenLine));
          if (children) nodes.push({ kind: "emphasis", children });
          continue;
        }
        case "codespan":
          nodes.push({ kind: "code", text: known.text });
          continue;
        case "br":
          nodes.push({ kind: "break" });
          continue;
        case "link": {
          const node = nested(tokenLine, () => link(known, tokenLine));
          if (node) nodes.push(node);
          continue;
        }
        case "html":
          refuse(tokenLine, isComment(known.text) ? refusals.comment : refusals.html);
          continue;
        case "image":
          refuse(tokenLine, refusals.image);
          continue;
        case "del":
          refuse(tokenLine, refusals.strikethrough);
          continue;
      }
      refuse(tokenLine, `Markdown of type "${token.type}" is not allowed in a guide.`);
    }
    closeRun();
    // A line break inside a paragraph is a soft break, shown as a single space.
    return nodes.map((node) => (node.kind === "text" ? { kind: "text", text: node.text.replace(softBreak, " ") } : node));
  }

  function link(token: Tokens.Link, at: number): InlineNode | undefined {
    const children = inline(token.tokens, at);
    // With a matching definition, marked turns footnote syntax into a link.
    if (footnoteLink.test(token.raw)) {
      refuse(at, refusals.footnote);
      return undefined;
    }
    references.push({ href: token.href, line: at });
    if (token.title) refuse(at, `Link titles are not shown in a guide: remove the title "${token.title}" from the link.`);
    const [reference] = token.href.match(characterReference) ?? [];
    if (reference) refuse(at, `The link target "${token.href}" contains the character reference "${reference}": type the character itself instead.`);
    else if (linkShape(token.href) === "refused") {
      refuse(at, `The link target "${token.href}" is not allowed: link to a page path such as /sales/leads, or to a guide section as guide:<guide key>#<section id>.`);
    }
    return { kind: "link", href: token.href, children };
  }
}

const isComment = (html: string) => html.trimStart().startsWith("<!--");
