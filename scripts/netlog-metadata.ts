import { writeFile, mkdir, rm, stat, readdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
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
const aggregateOnly = new Set(["SOCKET_BYTES_RECEIVED", "SOCKET_BYTES_SENT", "SSL_SOCKET_BYTES_RECEIVED", "SSL_SOCKET_BYTES_SENT", "URL_REQUEST_JOB_BYTES_READ", "URL_REQUEST_JOB_FILTERED_BYTES_READ", "URL_REQUEST_JOB_BYTES_SENT", "SOCKET_POOL_USAGE", "DISK_CACHE_ENTRY_IMPL", "COOKIE_INCLUSION_STATUS", "COOKIE_STORE_COOKIE"]);

// Export metadata only. Never spread input objects, stringify raw parameters,
// retain headers/bytes, or copy arbitrary string fields into review artifacts.
function decoder(constants: RecordValue) {
  const names = (value: unknown) => new Map(Object.entries(record(value))
    .filter(([key, id]) => symbol(key) && Number.isInteger(id))
    .map(([key, id]) => [id as number, key]));
  const types = names(constants.logEventTypes), sources = names(constants.logSourceType);
  const phases = names(constants.logEventPhase);
  if (!types.size || !sources.size) throw new Error("Invalid NetLog schema");
  return (value: unknown) => {
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
  };
}

type Event = ReturnType<ReturnType<typeof decoder>>;
function collector(constants: RecordValue) {
  const decode = decoder(constants), events: Event[] = [];
  const summaries = new Map<number, {
    source_id: number; source_type: string; first_ms?: number; last_ms?: number; asset_path?: string;
    stages: Record<string, { count: number; first_ms?: number; last_ms?: number; byte_count: number }>;
    dependencies: { id: number; type?: string }[]; net_errors: { at_ms?: number; code: number }[];
  }>();
  let total = 0, structural = 0, aggregated = 0, sourceOverflow = 0;
  return {
    add(value: unknown) {
      const event = decode(value); total++;
      if (event.source_id !== undefined) {
        let summary = summaries.get(event.source_id);
        if (!summary && summaries.size < 60000) {
          summary = { source_id: event.source_id, source_type: event.source_type, first_ms: event.time_ms, stages: {}, dependencies: [], net_errors: [] };
          summaries.set(event.source_id, summary);
        }
        if (summary) {
          summary.last_ms = event.time_ms;
          if (event.asset_path) summary.asset_path = event.asset_path;
          const key = `${event.type}:${event.phase}`;
          if (summary.stages[key] || Object.keys(summary.stages).length < 100) {
            const stage = summary.stages[key] ??= { count: 0, first_ms: event.time_ms, byte_count: 0 };
            stage.count++; stage.last_ms = event.time_ms; stage.byte_count += event.byte_count ?? 0;
          }
          if (event.dependency_id !== undefined && summary.dependencies.length < 16 && !summary.dependencies.some(d => d.id === event.dependency_id))
            summary.dependencies.push({ id: event.dependency_id, type: event.dependency_type });
          if (event.net_error !== undefined && event.net_error < 0 && summary.net_errors.length < 8)
            summary.net_errors.push({ at_ms: event.time_ms, code: event.net_error });
        } else sourceOverflow++;
      }
      // Per-packet events previously displaced nearly the entire run. Preserve
      // their counts/bytes/first/last times per source, plus bounded structural
      // events for ordering. Measured samples are unaffected by this encoding.
      if (aggregateOnly.has(event.type)) aggregated++;
      else { events[structural % eventLimit] = event; structural++; }
    },
    result() {
      const position = structural % eventLimit;
      return {
        time_tick_offset_ms: numeric(constants.timeTickOffset), original_event_count: total,
        retained_event_count: events.length, event_limit: eventLimit,
        aggregated_packet_events: aggregated, source_limit: 60000, source_overflow_events: sourceOverflow,
        retention: "Most recent structural events plus source lifecycles across the complete available capture; packet events become per-source counts, bytes and first/last times",
        truncated: structural > eventLimit || sourceOverflow > 0,
        events: structural > eventLimit ? [...events.slice(position), ...events.slice(0, position)] : events,
        source_summaries: [...summaries.values()],
        boundary: "Allowlisted event/source/phase symbols, numeric times/dependencies/byte counts/status/errors, and same-origin static asset paths only. No headers, cookies, credentials, bodies, or user identifiers",
      };
    },
  };
}

export function netlogMetadata(input: unknown) {
  const raw = record(input);
  if (!Array.isArray(raw.events)) throw new Error("Invalid NetLog schema");
  const capture = collector(record(raw.constants));
  for (const event of raw.events) capture.add(event);
  return capture.result();
}

// Chromium's pinned FileNetLogObserver JSON writer emits one constants line,
// an events-array opener, one event per line, and a closing/polled-data tail.
// Stream that documented source format; never retain the full raw object graph.
export async function streamNetlog(path: string) {
  const input = createReadStream(path), digest = createHash("sha256");
  let byteCount = 0;
  input.on("data", chunk => { digest.update(chunk); byteCount += chunk.length; });
  const lines = createInterface({ input, crlfDelay: Infinity });
  let capture: ReturnType<typeof collector> | undefined, phase = "constants", footer = "";
  try {
    for await (const line of lines) {
      if (line.length > 8 * 1024 * 1024) throw new Error("NetLog line exceeds diagnostic bound");
      if (phase === "constants") {
        if (!line.startsWith('{"constants":') || !line.endsWith(",")) throw new Error("Unexpected NetLog constants");
        capture = collector(record(JSON.parse(line.slice(0, -1) + "}").constants));
        phase = "array";
      } else if (phase === "array") {
        if (line.trim() !== '"events": [') throw new Error("Unexpected NetLog event array");
        phase = "events";
      } else if (phase === "events") {
        const closing = line.endsWith("]}") || line.endsWith("],") || line === "]";
        const marker = closing ? line.lastIndexOf("]") : -1;
        const value = closing ? line.slice(0, marker) : line.replace(/,$/, "");
        if (value) capture!.add(JSON.parse(value));
        if (closing) { footer = line.slice(marker + 1); phase = "footer"; }
      } else {
        footer += line;
        if (footer.length > 8 * 1024 * 1024) throw new Error("NetLog footer exceeds diagnostic bound");
      }
    }
    if (!capture || phase !== "footer") throw new Error("Incomplete NetLog capture");
    JSON.parse('{"events":[]' + footer);
    return { ...capture.result(), raw_byte_count: byteCount, raw_sha256: digest.digest("hex") };
  } finally { lines.close(); input.destroy(); }
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
    if (info.size > 72 * 1024 * 1024) throw new Error("Capture exceeds bound");
    result = { raw_byte_count: info.size, status: "invalid-or-incomplete" };
    result = { ...await streamNetlog(path), raw_may_have_rotated: info.size >= 64 * 1024 * 1024, status: "prepared" };
  } catch {
    // JSON parse errors may contain raw headers, URLs or body fragments.
    // Retain only this fixed category, never exception text.
    result = { ...result, failure: "Capture unavailable, invalid, incomplete or over bound" };
  }
  return result;
}

async function prepare() {
  const directory = netlogDirectory();
  if (!directory) throw new Error("NetLog diagnostic directory is required");
  const output = "verification-evidence/p11-performance/netlog-metadata.json";
  let result: RecordValue = { status: "unavailable", captures: [] };
  try {
    const names = (await readdir(directory).catch(() => [] as string[]))
      .filter(name => /^network(-user-\d{1,2})?\.json$/.test(name)).sort();
    const captures: RecordValue[] = [];
    for (const name of names) captures.push({ capture: name, ...await prepareCapture(resolve(directory, name)) });
    const completeSet = names.length === 1 && names[0] === "network.json" ||
      names.length === 10 && Array.from({ length: 10 }, (_, user) => `network-user-${user}.json`).every(name => names.includes(name));
    result = { status: completeSet && captures.every(c => c.status === "prepared") ? "prepared" : captures.length ? "partial" : "unavailable", complete_capture_set: completeSet, captures };
    if (result.status !== "prepared") throw new Error("NetLog capture incomplete");
  } finally {
    await mkdir("verification-evidence/p11-performance", { recursive: true });
    await writeFile(output, JSON.stringify(result, null, 2) + "\n");
    await rm(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await prepare().catch((error) => { console.error("NetLog metadata preparation failed:", error.message || error); process.exitCode = 1; });
