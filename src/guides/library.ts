// Server/CLI filesystem reader. Never import into a client component.
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { readMaster } from "../development/catalog";
import type { Entry } from "../development/model";
import { compileGuide } from "./compile";
import { linkShape } from "./links";
import type { CompiledGuide, GuideError, GuideLibrary } from "./model";
import { isRouteEntry, releasedGuides, routeForPath, type ReleasedLibrary } from "./released";

export type { GuideLibrary } from "./model";

const guidesFolder = "docs/guides";
// Written by scripts/build-guides.ts and read by the production server (ADR-0065, decision 8).
export const releasedFile = ".ppo-guides/released.json";

// The TypeScript guides that stage 1 carries over to Markdown. A guide's carried_over_from names one of these.
export const carriedOverSources = [
  "src/components/leads-guide.ts",
  "src/activities/work-guide.ts",
  "src/components/estimating-workload-guide.ts",
  "src/components/cost-sources-guide.ts",
  "src/supply/guide.ts",
  "src/engineering/control/guide.ts",
  "src/shell/guide.ts",
] as const;

// Guide files that still use the old page guide template. They are skipped, not compiled; plan Task 5 (the CRM
// pilot rewrite) removes this entry.
export const awaitingRewrite = ["docs/guides/crm-deals.md"] as const;

// What one file contributes. `front` holds the front matter lines, so that a cross-check can name the file line of a
// key (the front matter starts on file line 2). A file that is not a guide has no errors and no lines.
type FileRead = { guide?: CompiledGuide; errors: GuideError[]; front: string[] };

const guideKeyLine = /^guide_key\s*:/;

const errorCode = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;

// The lines between the opening --- and the closing ---, or to the end of the file when it is not closed, so that
// a guide with broken front matter is still found and reported rather than ignored.
function frontMatterOf(text: string): string[] | undefined {
  const lines = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n");
  if (lines[0].trimEnd() !== "---") return undefined;
  const closing = lines.indexOf("---", 1);
  return lines.slice(1, closing < 0 ? lines.length : closing);
}

// Every Markdown file under docs/guides that is not waiting for its rewrite, as sorted repository paths.
async function markdownPaths(root: string): Promise<string[]> {
  const skipped = new Set<string>(awaitingRewrite);
  const found: string[] = [];
  const walk = async (folder: string): Promise<void> => {
    let children;
    try {
      children = await readdir(resolve(root, folder), { withFileTypes: true });
    } catch (error) {
      if (folder === guidesFolder && errorCode(error) === "ENOENT") return;
      throw error;
    }
    for (const child of children) {
      if (child.isSymbolicLink()) continue;
      const path = `${folder}/${child.name}`;
      if (child.isDirectory()) await walk(path);
      else if (child.isFile() && child.name.endsWith(".md") && !skipped.has(path)) found.push(path);
    }
  };
  await walk(guidesFolder);
  return found.sort();
}

// The development server compiles a file again only when its mtime changes. The key includes the repository path
// because the path is part of every result. Production reads the release file instead and never uses this.
const cache = new Map<string, { mtimeMs: number; read: FileRead }>();

async function readGuideFile(root: string, path: string): Promise<FileRead> {
  const file = resolve(root, path);
  const key = `${file}\n${path}`;
  const caching = process.env.NODE_ENV !== "production";
  let mtimeMs: number;
  let text: string;
  try {
    mtimeMs = (await stat(file)).mtimeMs;
    const hit = caching ? cache.get(key) : undefined;
    if (hit?.mtimeMs === mtimeMs) return hit.read;
    text = await readFile(file, "utf8");
  } catch (error) {
    return { errors: [{ path, line: 1, message: `The file could not be read (${errorCode(error) ?? "unknown error"}).` }], front: [] };
  }
  const read = compileFile(path, text);
  if (caching) cache.set(key, { mtimeMs, read });
  return read;
}

// A file is a guide when its front matter declares a guide_key. Presence of an entry_key decides nothing, so a
// malformed guide cannot slip through as an ordinary document.
function compileFile(path: string, text: string): FileRead {
  const front = frontMatterOf(text);
  if (!front?.some((line) => guideKeyLine.test(line))) return { errors: [], front: [] };
  try {
    const { guide, errors } = compileGuide(path, text);
    return { guide, errors, front };
  } catch (error) {
    // marked can throw on pathological input, such as thousands of nested quotes. That file is reported alone.
    const reason = error instanceof Error ? `${error.name}: ${error.message.split("\n")[0]}` : "unknown error";
    return { errors: [{ path, line: 1, message: `The guide could not be compiled (${reason}). Very deeply nested quotes or lists can cause this.` }], front };
  }
}

// Discovers docs/guides/**/*.md, compiles each guide and checks the guides against the register and against each
// other. A guide with any error, from its own file or from a cross-check, is left out of `guides`.
export async function readGuideLibrary(root: string, entries: Entry[]): Promise<GuideLibrary> {
  const errors: GuideError[] = [];
  const candidates: Candidate[] = [];
  for (const path of await markdownPaths(root)) {
    const read = await readGuideFile(root, path);
    errors.push(...read.errors);
    if (read.guide) candidates.push({ guide: read.guide, front: read.front });
  }
  const problems = crossCheck(candidates, entries);
  for (const list of problems.values()) errors.push(...list);
  const guides = candidates.filter((candidate) => !problems.has(candidate)).map((candidate) => candidate.guide);
  errors.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.line - b.line));
  return { guides, errors };
}

type Candidate = { guide: CompiledGuide; front: string[] };
type FrontKey = "guide_key" | "entry_key" | "also_applies_to" | "carried_over_from" | "contents" | "list_styles" | "section_aliases";

// The file line of a top-level front matter key, or line 1 when it cannot be found.
function frontLine(front: string[], key: FrontKey): number {
  const pattern = new RegExp(`^${key}\\s*:`);
  const index = front.findIndex((line) => pattern.test(line));
  return index < 0 ? 1 : index + 2;
}

// The checks that need more than one file, or the register. Each problem is an error for the file that holds it.
function crossCheck(candidates: Candidate[], entries: Entry[]): Map<Candidate, GuideError[]> {
  const problems = new Map<Candidate, GuideError[]>();
  const flag = (candidate: Candidate, line: number, message: string) => {
    problems.set(candidate, [...(problems.get(candidate) ?? []), { path: candidate.guide.path, line, message }]);
  };
  const flagKey = (candidate: Candidate, key: FrontKey, message: string) => flag(candidate, frontLine(candidate.front, key), message);

  const registered = new Map(entries.map((entry) => [entry.key, entry]));
  const routes = entries.filter(isRouteEntry).map((entry) => ({ path: entry.path, guide_key: null }));
  const sources = new Set<string>(carriedOverSources);
  const withGuideKey = new Map<string, Candidate[]>();
  const claimants = new Map<string, Candidate[]>();
  const add = (map: Map<string, Candidate[]>, key: string, candidate: Candidate) => map.set(key, [...(map.get(key) ?? []), candidate]);
  for (const candidate of candidates) {
    const { front } = candidate.guide;
    add(withGuideKey, front.guide_key, candidate);
    // One claim per guide, so listing its own entry_key again under also_applies_to is not a clash.
    for (const key of new Set([front.entry_key, ...front.also_applies_to])) {
      if (registered.has(key)) add(claimants, key, candidate);
    }
  }

  for (const candidate of candidates) {
    const { guide } = candidate;
    const { front } = guide;

    const bound = registered.get(front.entry_key);
    if (!bound) {
      flagKey(candidate, "entry_key", `entry_key "${front.entry_key}" is not in the development register. Check the spelling, or register the page first.`);
    } else if (bound.guide_key !== front.guide_key) {
      const register = bound.guide_key === null ? `no guide_key` : `the guide_key "${bound.guide_key}"`;
      flagKey(candidate, "guide_key", `guide_key "${front.guide_key}" does not match the development register, which gives "${bound.key}" ${register}.`);
    }
    for (const key of front.also_applies_to) {
      if (!registered.has(key)) flagKey(candidate, "also_applies_to", `also_applies_to names "${key}", which is not in the development register.`);
    }

    const sections = new Set(guide.sections.map((section) => section.id));
    for (const [alias, target] of Object.entries(front.section_aliases)) {
      if (!sections.has(target)) flagKey(candidate, "section_aliases", `section_aliases: "${alias}" points to "${target}", which is not a section id in this guide.`);
    }
    for (const id of Object.keys(front.contents)) {
      if (!sections.has(id)) flagKey(candidate, "contents", `contents: "${id}" is not a section id in this guide.`);
    }
    for (const id of Object.keys(front.list_styles)) {
      if (!sections.has(id)) flagKey(candidate, "list_styles", `list_styles: "${id}" is not a section id in this guide.`);
    }
    if (front.carried_over_from !== null && !sources.has(front.carried_over_from)) {
      flagKey(candidate, "carried_over_from", `carried_over_from "${front.carried_over_from}" is not a known carried-over source. The sources are listed in carriedOverSources in src/guides/library.ts.`);
    }

    for (const { href, line } of guide.references) {
      const shape = linkShape(href);
      if (shape === "route") {
        if (!routeForPath(routes, href)) flag(candidate, line, `The link "${href}" does not match any page in the development register. Fix the link, or register the page.`);
      } else if (shape === "guide") {
        // The shape is guide:<guide key>#<section id>, so the first # ends the key.
        const key = href.slice("guide:".length, href.indexOf("#"));
        const section = href.slice(href.indexOf("#") + 1);
        const target = withGuideKey.get(key)?.[0]?.guide;
        if (!target) {
          flag(candidate, line, `The link "${href}" points to a guide that does not exist: no guide has the guide_key "${key}".`);
        } else if (!target.sections.some((candidateSection) => candidateSection.id === section) && !Object.hasOwn(target.front.section_aliases, section)) {
          flag(candidate, line, `The link "${href}" points to a section that does not exist: guide "${key}" has no section id or alias "${section}".`);
        }
      }
    }
  }

  // A guide key or an entry key shared by two guides refuses all of them: neither has a better claim.
  for (const [key, group] of withGuideKey) {
    if (group.length < 2) continue;
    for (const candidate of group) {
      const others = group.filter((other) => other !== candidate).map((other) => other.guide.path);
      flagKey(candidate, "guide_key", `guide_key "${key}" is also used by ${others.join(", ")}: every guide needs its own guide_key.`);
    }
  }
  for (const [key, group] of claimants) {
    if (group.length < 2) continue;
    for (const candidate of group) {
      const others = group.filter((other) => other !== candidate).map((other) => other.guide.path);
      const claimedBy = candidate.guide.front.entry_key === key ? "entry_key" : "also_applies_to";
      flagKey(candidate, claimedBy, `"${key}" is also claimed by ${others.join(", ")}: an entry can belong to only one guide.`);
    }
  }
  return problems;
}

// The guides general users may see, for the shell. Production reads the file that the build wrote; development
// compiles the guide files on request. It never throws: any failure is logged once and the shell shows no guides.
const empty = (): ReleasedLibrary => ({ guides: [], routes: [], shell: null });
const remembered = new Map<string, ReleasedLibrary>();

export async function releasedGuideLibrary(root = process.cwd()): Promise<ReleasedLibrary> {
  try {
    if (process.env.NODE_ENV === "production") {
      const key = resolve(root);
      const kept = remembered.get(key);
      if (kept) return kept;
      const released = await readReleaseFile(root);
      remembered.set(key, released);
      return released;
    }
    const { entries } = await readMaster(root);
    return releasedGuides(await readGuideLibrary(root, entries), entries);
  } catch (error) {
    console.error(`User guides are unavailable: ${describeFailure(error)}.`);
    return empty();
  }
}

async function readReleaseFile(root: string): Promise<ReleasedLibrary> {
  let text: string;
  try {
    text = await readFile(resolve(root, releasedFile), "utf8");
  } catch (error) {
    throw new Error(errorCode(error) === "ENOENT" ? `${releasedFile} is missing: the build writes it` : `${releasedFile} could not be read`);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${releasedFile} is not valid JSON`);
  }
  if (!isReleased(data)) throw new Error(`${releasedFile} does not have the expected shape`);
  return data;
}

// A minimal shape check. The file is written by the build from the same types, so it is not validated further.
function isReleased(data: unknown): data is ReleasedLibrary {
  if (typeof data !== "object" || data === null) return false;
  const { guides, routes, shell } = data as Record<string, unknown>;
  return Array.isArray(guides) && Array.isArray(routes) && (shell === null || (typeof shell === "object" && !Array.isArray(shell)));
}

// One short reason with no stack and no file contents: a JSON error message quotes the text it could not read.
function describeFailure(error: unknown): string {
  if (error instanceof SyntaxError) return "a file is not valid JSON";
  const code = errorCode(error);
  if (code) return `the file system reported ${code}`;
  if (error instanceof Error) return error.message.split("\n")[0];
  return "an unknown error";
}
