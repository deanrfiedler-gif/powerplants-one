import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";

// Opt-in, local synthetic verification only. Never record request headers,
// query strings, bodies, identities, output content or exception messages.
const enabled = process.env.PPO_PROOF_DIAGNOSTICS === "1" &&
  process.env.PPO_ENV === "local-synthetic" && process.env.PPO_EXPOSURE === "loopback" &&
  process.env.PPO_IDENTITY === "synthetic" && process.env.NODE_ENV !== "production";
let count = 0;
const limit = 60000;
type ProofRequest = { request_id: number; path: string; route_id?: number };
// Next's development bundler can load another copy of this module. Share only
// numeric diagnostic context within this process; never request data or grants.
const scopeKey = Symbol.for("ppo.synthetic-proof-request");
const diagnosticGlobal = globalThis as typeof globalThis & {
  [scopeKey]?: AsyncLocalStorage<ProofRequest>;
};
const scope = diagnosticGlobal[scopeKey] ??= new AsyncLocalStorage<ProofRequest>();
let routeId = 0;
const tracedRead = (path: string) => /^\/api\/v1\/(?:(?:reports|my-jobs)\/:id|schedule|sites)$/.test(path);
export const proofDiagnosticsEnabled = () => enabled;
export function proofRequest<T>(request: ProofRequest, work: () => T): T {
  return enabled ? scope.run(request, work) : work();
}
export function proofReadRequest<T>(path: string, work: () => T): T {
  const safePath = proofPath(path);
  if (!enabled || !tracedRead(safePath)) return work();
  // A fallback route ID makes missing gateway-context propagation observable.
  return scope.run({ request_id: 0, ...scope.getStore(), path: safePath, route_id: ++routeId }, work);
}
export function proofReadPhase(phase: string, fields: Record<string, number> = {}) {
  const current = scope.getStore();
  if (enabled && current && tracedRead(current.path))
    proofEvent("read-phase", { phase, ...fields });
}

// Compare known driver constants; never retain arbitrary exception text/codes.
// pg-pool distinguishes a queued checkout expiry from a new connection expiry.
export function dependencyFailureCategory(error: unknown): string {
  try {
    if (!error || typeof error !== "object") return "unclassified";
    const value = error as { message?: unknown; code?: unknown };
    if (value.message === "timeout exceeded when trying to connect") return "pool-checkout-timeout";
    if (value.message === "Connection terminated due to connection timeout") return "connection-start-timeout";
    switch (value.code) {
      case "ECONNREFUSED": return "connection-refused";
      case "ECONNRESET": return "connection-reset";
      case "ETIMEDOUT": return "connection-timeout";
      case "57014": return "query-cancelled";
      case "53300": return "connection-limit";
      case "57P01": return "database-shutdown";
      case "40P01": return "deadlock";
      case "40001": return "serialization-failure";
      default: return "unclassified";
    }
  } catch { return "unclassified"; }
}
export function proofDependencyFailure(error: unknown, fields: Record<string, number>) {
  if (enabled) proofEvent("dependency-failed", { category: dependencyFailureCategory(error), ...fields });
}
export function proofEvent(event: string, fields: Record<string, string | number | boolean | null> = {}) {
  if (!enabled || count > limit) return;
  try {
    const root = join(process.cwd(), "verification-evidence", "transport-diagnostics");
    if (count === 0) mkdirSync(root, { recursive: true });
    appendFileSync(join(root, `process-${process.pid}.jsonl`), JSON.stringify({
      at_ms: Date.now(), pid: process.pid, sequence: count,
      ...(scope.getStore() ?? {}),
      ...(count === limit ? { event: "diagnostic-cap-reached" } : { event, ...fields }),
    }) + "\n");
    count++;
  } catch { /* Diagnostic availability must never change a business outcome. */ }
}

export function proofPath(raw: string) {
  const path = raw.split("?")[0].replace(/[0-9a-f]{32,}/gi, "opaque");
  if (/^\/_next\/static\/[a-zA-Z0-9_./%\[\]@()+-]+$/.test(path)) return path.slice(0, 240);
  if (/^\/(api\/v1\/|customers|sites|schedule|my-jobs|service|documents|finance|crm|work|people|equipment)/.test(path) &&
      /^\/[a-zA-Z0-9_/-]+$/.test(path))
    return path.split("/").map(part => {
      if (!part || ["api", "v1", "customers", "sites", "local-session", "render-jobs", "report-render-jobs", "retry", "packs", "reports", "my-jobs", "schedule", "service", "work-orders", "appointments", "documents", "finance", "crm", "opportunities", "work", "people", "equipment", "activities"].includes(part)) return part;
      return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part) ? ":id" : ":other";
    }).join("/").slice(0, 160);
  return path === "/" ? "/" : "/other";
}
