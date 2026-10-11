import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { CDPSession } from "@playwright/test";

export const assetSampleHeader = "x-ppo-asset-sample";
export const assetDiagnosticsAllowed = (env: Record<string, string | undefined>, compiled: boolean) =>
  compiled && env.PPO_ASSET_DIAGNOSTICS === "1" && env.PPO_ENV === "local-synthetic" &&
  env.PPO_EXPOSURE === "loopback" && env.PPO_IDENTITY === "synthetic" && env.NODE_ENV !== "production" &&
  env.PPO_BENCHMARK_FIXTURE === "add-synthetic-load" && /^cpu-assets-[a-z0-9-]+$/.test(env.PPO_COMPARISON_BLOCK ?? "");
export const assetReleaseProbeAllowed = (env: Record<string, string | undefined>) =>
  assetDiagnosticsAllowed(env, true) && env.PPO_ASSET_RELEASE_PROBE === "1" &&
  /^cpu-assets-release-[a-z0-9-]+$/.test(env.PPO_COMPARISON_BLOCK ?? "");

export const assetPath = (raw: string) =>
  /^\/_next\/static\/chunks\/[A-Za-z0-9._-]{1,160}\.(?:js|css)$/.test(raw.split("?", 1)[0])
    ? raw.split("?", 1)[0] : null;

type AssetEvent = Record<string, string | number | boolean | null>;

// Only the synthetic loopback launcher imports this observer. No response or
// socket method is replaced. "finish" is OS handoff, not browser receipt.
export function createAssetObserver(env: Record<string, string | undefined>, compiled: boolean,
  sink?: (event: AssetEvent) => void) {
  if (!assetDiagnosticsAllowed(env, compiled)) return () => {};
  let sequence = 0, requestId = 0;
  const root = join(process.cwd(), "verification-evidence", "asset-diagnostics");
  const emit = (event: AssetEvent) => {
    if (sequence > 10000) return;
    try {
      const row = { at_ms: Date.now(), pid: process.pid, sequence,
        ...(sequence === 10000 ? { event: "asset-cap-reached" } : event) };
      if (sink) sink(row);
      else {
        if (sequence === 0) mkdirSync(root, { recursive: true });
        appendFileSync(join(root, `process-${process.pid}.jsonl`), JSON.stringify(row) + "\n");
      }
      sequence++;
    } catch { /* Missing observation must not change application behaviour. */ }
  };
  return (req: IncomingMessage, res: ServerResponse) => {
    const sample = req.headers[assetSampleHeader];
    delete req.headers[assetSampleHeader];
    const path = assetPath(req.url ?? "");
    if (req.method !== "GET" || !path || typeof sample !== "string" || !/^(desktop|phone)-[0-3]-[0-9]$/.test(sample)) return;
    const identity = { request_id: ++requestId, sample, path }, began = performance.now();
    emit({ ...identity, event: "asset-received" });
    const state = () => {
      const length = res.getHeader("content-length");
      return { ...identity, elapsed_ms: performance.now() - began, status: res.statusCode,
        headers_sent: res.headersSent, writable_finished: res.writableFinished,
        declared_bytes: /^\d+$/.test(String(length)) ? Number(length) : null };
    };
    res.once("finish", () => emit({ ...state(), event: "asset-finished" }));
    res.once("close", () => emit({ ...state(), event: "asset-closed" }));
    req.once("aborted", () => emit({ ...identity, event: "asset-request-aborted", elapsed_ms: performance.now() - began }));
  };
}

const errors = new Set(["net::ERR_ABORTED", "net::ERR_FAILED", "net::ERR_TIMED_OUT", "net::ERR_CONNECTION_RESET",
  "net::ERR_CONNECTION_CLOSED", "net::ERR_CONNECTION_REFUSED", "net::ERR_INCOMPLETE_CHUNKED_ENCODING",
  "net::ERR_CONTENT_LENGTH_MISMATCH", "net::ERR_INSUFFICIENT_RESOURCES", "net::ERR_NETWORK_CHANGED", "net::ERR_EMPTY_RESPONSE"]);
export function assetFailure(errorText: string, canceled?: boolean) {
  return { error_code: errors.has(errorText) ? errorText : "other", canceled: canceled === true };
}
const timingFields = ["requestTime", "proxyStart", "proxyEnd", "dnsStart", "dnsEnd", "connectStart", "connectEnd", "sslStart", "sslEnd", "sendStart", "sendEnd", "receiveHeadersStart", "receiveHeadersEnd"] as const;

// Existing CDP connection, numeric/enum fields only; no headers or body capture.
export function observeAssetNetwork(cdp: CDPSession, network: Map<string, Record<string, unknown>>, start: () => number) {
  const received = (e: { requestId: string; timestamp: number; dataLength: number; encodedDataLength: number }) => {
    const row = network.get(e.requestId);
    if (row) Object.assign(row, { data_events: Number(row.data_events ?? 0) + 1,
      data_bytes: Number(row.data_bytes ?? 0) + e.dataLength,
      encoded_data_bytes: Number(row.encoded_data_bytes ?? 0) + e.encodedDataLength,
      last_data_ms: 1000 * (e.timestamp - start()) });
  };
  const failed = (e: { requestId: string; timestamp: number; errorText: string; canceled?: boolean }) => {
    const row = network.get(e.requestId);
    if (row) Object.assign(row, { failed_ms: 1000 * (e.timestamp - start()), ...assetFailure(e.errorText, e.canceled) });
  };
  const response = (e: { requestId: string; response: { protocol?: string; connectionId: number; connectionReused: boolean;
    fromDiskCache?: boolean; fromServiceWorker?: boolean; timing?: Partial<Record<typeof timingFields[number], number>> } }) => {
    const row = network.get(e.requestId), r = e.response;
    if (!row) return;
    Object.assign(row, { protocol: ["http/1.1", "h2", "h3"].includes(r.protocol ?? "") ? r.protocol : "other",
      connection_id: r.connectionId, connection_reused: r.connectionReused,
      disk_cache: r.fromDiskCache === true, service_worker: r.fromServiceWorker === true,
      response_timing: Object.fromEntries(timingFields.filter(k => Number.isFinite(r.timing?.[k])).map(k => [k, r.timing![k]])) });
  };
  cdp.on("Network.dataReceived", received).on("Network.loadingFailed", failed).on("Network.responseReceived", response);
  return () => cdp.off("Network.dataReceived", received).off("Network.loadingFailed", failed).off("Network.responseReceived", response);
}
