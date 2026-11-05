// Server only: the root layout's reader for the guides general users may see (ADR-0065, decision 8). Never import into
// a client component. Production reads the file the build wrote, from a fixed path, so the build traces that one file.
// Development compiles the guide files on request through library.ts, which is imported only outside production, so
// it and the register reader it uses stay out of every production page's build trace.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CompiledGuide } from "./model";
import { visibleRelease, type ReleasedLibrary, type ReleasedRoute } from "./released";

// Written by scripts/build-guides.ts and read by the production server.
export const releasedFile = ".ppo-guides/released.json";

const empty = (): ReleasedLibrary => ({ guides: [], routes: [], shell: null });

// The guides the shell shows. It never throws: a failure is logged and the shell shows no guides. `root` is the
// repository that development compiles from (tests pass a temporary one); production always reads from the working
// directory, through a path the build can resolve statically. A computed path there makes the build trace the whole
// repository into every page.
export async function releasedGuideLibrary(root?: string): Promise<ReleasedLibrary> {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { compiledReleasedLibrary } = await import("./library");
      return await compiledReleasedLibrary(root ?? process.cwd());
    } catch (error) {
      console.error(`User guides are unavailable: ${describeFailure(error)}.`);
      return empty();
    }
  }
  return readReleasedLibrary(join(process.cwd(), ".ppo-guides", "released.json"));
}

// A read that may succeed if tried again: the file exists but the file system refused it this time.
class RetryableReadFailure extends Error {}

// One read per release file for the life of the process. Requests that arrive while it runs share it, so a failure is
// logged once. The build writes the file before the server starts, so a successful read, a missing file and a damaged
// one are kept; a retryable read failure is forgotten, so the next request reads again rather than hiding the guides
// until the server restarts.
const remembered = new Map<string, Promise<ReleasedLibrary>>();

export function readReleasedLibrary(file: string): Promise<ReleasedLibrary> {
  const kept = remembered.get(file);
  if (kept) return kept;
  const reading: Promise<ReleasedLibrary> = readReleaseFile(file).catch((error: unknown) => {
    console.error(`User guides are unavailable: ${describeFailure(error)}.`);
    if (error instanceof RetryableReadFailure && remembered.get(file) === reading) remembered.delete(file);
    return empty();
  });
  remembered.set(file, reading);
  return reading;
}

async function readReleaseFile(file: string): Promise<ReleasedLibrary> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if (errorCode(error) === "ENOENT") throw new Error(`${releasedFile} is missing: the build writes it`);
    throw new RetryableReadFailure(`${releasedFile} could not be read`);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${releasedFile} is not valid JSON`);
  }
  if (!isReleased(data)) throw new Error(`${releasedFile} does not have the expected shape`);
  return visibleRelease(data);
}

// The build writes the file from the same types, but a damaged file must not break the shell, which calls guideForPath
// while it renders. So every element that guideForPath reads is checked: each route's path and guide key, and each
// guide's front matter guide key. A guide's sections and lead must be lists; the renderer tolerates anything inside them.
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

const isReleasedGuide = (value: unknown): value is CompiledGuide =>
  isRecord(value) && isRecord(value.front) && typeof value.front.guide_key === "string" && Array.isArray(value.sections) && Array.isArray(value.lead);

const isReleasedRoute = (value: unknown): value is ReleasedRoute =>
  isRecord(value) && typeof value.path === "string" && (typeof value.guide_key === "string" || value.guide_key === null);

function isReleased(data: unknown): data is ReleasedLibrary {
  if (!isRecord(data)) return false;
  const { guides, routes, shell } = data;
  return Array.isArray(guides) && guides.every(isReleasedGuide) && Array.isArray(routes) && routes.every(isReleasedRoute) && (shell === null || isReleasedGuide(shell));
}

const errorCode = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;

// One short reason with no stack and no file contents: a JSON error message quotes the text it could not read.
function describeFailure(error: unknown): string {
  if (error instanceof SyntaxError) return "a file is not valid JSON";
  const code = errorCode(error);
  if (code) return `the file system reported ${code}`;
  if (error instanceof Error) return error.message.split("\n")[0];
  return "an unknown error";
}
