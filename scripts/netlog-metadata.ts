import { readFile, readdir, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const numeric = (value: unknown) =>
  (typeof value === "number" || typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) && Number.isFinite(Number(value)) ? Number(value) : undefined;
const symbol = (value: string) => /^[A-Z][A-Z0-9_]{0,100}$/.test(value);
const eventLimit = 100000;
const scalarKeys = ["byte_count", "net_error", "os_error", "status_code", "content_length", "priority", "load_flags", "result"] as const;

// Export metadata only. Never spread input objects, stringify raw parameters,
// retain headers/bytes, or copy arbitrary string fields into review artifacts.
export function netlogMetadata(input: unknown) {
  const raw = record(input), constants = record(raw.constants);
  const names = (value: unknown) => new Map(Object.entries(record(value))
    .filter(([key, id]) => symbol(key) && Number.isInteger(id))
    .map(([key, id]) => [id as number, key]));
  const types = names(constants.logEventTypes), sources = names(constants.logSourceType);
  const phases = names(constants.logEventPhase);
  if (!Array.isArray(raw.events) || !types.size || !sources.size) throw new Error("Invalid NetLog schema");
  const events = raw.events.slice(-eventLimit).map((value: unknown) => {
    const event = record(value), source = record(event.source), params = record(event.params);
    const dependency = record(params.source_dependency);
    const scalars: Partial<Record<typeof scalarKeys[number], number>> = {};
    for (const key of scalarKeys)
      if (numeric(params[key]) !== undefined) scalars[key] = numeric(params[key])!;
    let assetPath: string | undefined;
    try {
      const url = new URL(typeof params.url === "string" ? params.url : "");
      // Only static build paths, with query/fragment/userinfo discarded.
      if (url.origin === "http://127.0.0.1:3000" && !url.username && !url.password &&
          /^\/_next\/static\/[A-Za-z0-9_./%\[\]()+@-]{1,400}\.(js|css|woff2?)$/.test(url.pathname)) assetPath = url.pathname;
    } catch { /* Non-URL events need no path. */ }
    return {
      time_ms: numeric(event.time),
      type: types.get(numeric(event.type) ?? -1) ?? "UNKNOWN",
      phase: phases.get(numeric(event.phase) ?? -1) ?? "UNKNOWN",
      source_id: numeric(source.id),
      source_type: sources.get(numeric(source.type) ?? -1) ?? "UNKNOWN",
      ...(numeric(dependency.id) === undefined ? {} : { dependency_id: numeric(dependency.id), dependency_type: sources.get(numeric(dependency.type) ?? -1) ?? "UNKNOWN" }),
      ...(assetPath ? { asset_path: assetPath } : {}),
      ...scalars,
    };
  });
  return {
    time_tick_offset_ms: numeric(constants.timeTickOffset),
    original_event_count: raw.events.length,
    retained_event_count: events.length,
    event_limit: eventLimit,
    retention: "Most recent events; earlier source creation may be outside capped coverage",
    truncated: raw.events.length > eventLimit,
    events,
    boundary: "Allowlisted event/source/phase symbols, numeric times/dependencies/byte counts/status/errors, and same-origin static asset paths only. No request/response headers, cookies, credentials, bodies, raw bytes, query strings, external URLs or arbitrary parameter strings. NetLog source IDs are not per-virtual-user identifiers. Capture overhead and capped coverage remain diagnostic limitations.",
  };
}

export function netlogDirectory() {
  const directory = process.env.PPO_NETLOG_DIRECTORY;
  if (!directory) return undefined;
  if (process.env.PPO_PROOF_DIAGNOSTICS !== "1" || !isAbsolute(directory) ||
      resolve(directory) !== resolve(process.env.RUNNER_TEMP ?? tmpdir(), "ppo-pt27-netlog") ||
      !relative(process.cwd(), directory).startsWith("..")) throw new Error("NetLog must use its dedicated temporary directory outside the repository and artifact roots");
  return directory;
}

async function prepareCapture(path: string) {
  let result: RecordValue = { status: "unavailable" };
  try {
    const info = await stat(path);
    // Chromium's bound excludes some constants/closing metadata. Refuse an
    // unexpectedly large input rather than parse it or retain raw fragments.
    if (info.size > 72 * 1024 * 1024) throw new Error("Capture exceeds bound");
    const bytes = await readFile(path);
    result = { raw_byte_count: bytes.length, raw_sha256: createHash("sha256").update(bytes).digest("hex"), status: "invalid-or-incomplete" };
    result = { ...result, ...netlogMetadata(JSON.parse(bytes.toString("utf8"))), status: "prepared" };
  } catch (error) {
    result = { ...result, failure: error instanceof Error ? error.message.slice(0, 120) : "Capture unavailable" };
  }
  return result;
}

async function prepare() {
  const directory = netlogDirectory();
  if (!directory) throw new Error("NetLog diagnostic directory is required");
  const output = "verification-evidence/p11-performance/netlog-metadata.json";
  // The load proof runs one browser process per virtual user, each with its
  // own bounded capture file; a single legacy capture name is also accepted.
  let result: RecordValue = { status: "unavailable", captures: [] };
  try {
    const names = (await readdir(directory).catch(() => [] as string[]))
      .filter((name) => /^network(-user-\d{1,2})?\.json$/.test(name)).sort();
    const captures: RecordValue[] = [];
    for (const name of names) captures.push({ capture: name, ...(await prepareCapture(resolve(directory, name))) });
    result = { status: captures.length && captures.every((c) => c.status === "prepared") ? "prepared" : captures.length ? "partial" : "unavailable", captures };
    if (result.status !== "prepared") throw new Error("NetLog capture incomplete");
  } finally {
    await mkdir("verification-evidence/p11-performance", { recursive: true });
    await writeFile(output, JSON.stringify(result, null, 2) + "\n");
    // Chromium may also create bounded temporary fragments alongside these
    // files. The dedicated directory is never an upload root.
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await prepare().catch(() => { console.error("NetLog metadata preparation failed; raw capture excluded and failure status retained"); process.exitCode = 1; });
