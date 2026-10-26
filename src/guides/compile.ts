// ADR-0065: this module is the only importer of marked and yaml. Everything else reads PPO's own guide model.
import { LineCounter, isMap, isScalar, parseDocument, visit } from "yaml";
import { guideStatuses, type GuideError, type GuideFrontMatter } from "./model";

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
  const lines = text.replace(/\r\n/g, "\n").split("\n");
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

  const shownValue = field("shown_before_review");
  if (shownValue !== undefined && typeof shownValue !== "boolean") report("shown_before_review", '"shown_before_review" must be true or false.');
  const shownBeforeReview = shownValue === true;
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
    contents: textMap("contents"),
    list_styles: listStyles,
    document_id: optionalText("document_id"),
    title: requiredText("title"),
    versioning: "git",
    status: status ?? "Draft",
    issued_revision: optionalText("issued_revision"),
    audience: optionalText("audience"),
    owner_role: requiredText("owner_role"),
    reviewer: optionalText("reviewer"),
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
