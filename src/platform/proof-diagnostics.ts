import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";

// Opt-in, local synthetic verification only. Never record request headers,
// query strings, bodies, identities, output content or exception messages.
// Read the runtime environment through an opaque lookup. Next substitutes
// NODE_ENV even through an inlined helper argument, which can erase enabled
// branches while leaving a dynamic condition in the guarded compiled launcher.
export const proofDiagnosticsAllowed = (env: Record<string, string | undefined>) =>
  env.PPO_PROOF_DIAGNOSTICS === "1" && env.PPO_ENV === "local-synthetic" &&
  env.PPO_EXPOSURE === "loopback" && env.PPO_IDENTITY === "synthetic" && env.NODE_ENV !== "production";
const enabled = proofDiagnosticsAllowed(Reflect.get(process, "env"));
let count = 0;
const limit = 60000;
let capReported = false;
let retainedWorkspaceCount = 0;
const retainedWorkspaceLimit = limit * 2;
const workspaceRead = "/api/v1/customers/:id/workspace";
type ProofRequest = { request_id: number; path: string; route_id?: number };
// Next's development bundler can load another copy of this module. Share only
// numeric diagnostic context within this process; never request data or grants.
const scopeKey = Symbol.for("ppo.synthetic-proof-request");
const diagnosticGlobal = globalThis as typeof globalThis & {
  [scopeKey]?: AsyncLocalStorage<ProofRequest>;
};
const scope = diagnosticGlobal[scopeKey] ??= new AsyncLocalStorage<ProofRequest>();
let routeId = 0;
export const proofDiagnosticsEnabled = () => enabled;
const measuredRead = (path: string) => /^\/api\/v1\/(?:reports\/:id|my-jobs\/:id|customers\/:id\/workspace|local-session|shell\/context|crm\/directory(?:\/views)?)$/.test(path);
// Capture only the existing numeric/sanitised context, never the request itself.
export function captureDatabaseProof() {
  const current = scope.getStore();
  if (!enabled || !current || !measuredRead(current.path)) return null;
  return (event: string, fields: Record<string, string | number | boolean | null>) =>
    scope.run(current, () => proofEvent(event, fields));
}
export function proofRequest<T>(request: ProofRequest, work: () => T): T {
  return enabled ? scope.run(request, work) : work();
}
export function proofReadRequest<T>(path: string, work: () => T): T {
  const safePath = proofPath(path);
  if (!enabled || !measuredRead(safePath)) return work();
  // A fallback route ID makes missing gateway-context propagation observable.
  return scope.run({ request_id: 0, ...scope.getStore(), path: safePath, route_id: ++routeId }, work);
}
export function proofReadPhase(phase: string) {
  const current = scope.getStore();
  if (enabled && current && measuredRead(current.path))
    proofEvent("read-phase", { phase });
}
export function proofEvent(event: string, fields: Record<string, string | number | boolean | null> = {}) {
  // Keep the late Customer 360 reads in a full compiled shard, even after
  // unrelated diagnostics exhaust the ordinary cap, with a separate ceiling.
  // Still opt-in/sanitised and never part of a business outcome.
  const retainWorkspace = scope.getStore()?.path === workspaceRead || fields.path === workspaceRead;
  if (!enabled || (capReported && (!retainWorkspace || retainedWorkspaceCount >= retainedWorkspaceLimit))) return;
  try {
    const root = join(process.cwd(), "verification-evidence", "transport-diagnostics");
    if (count === 0) mkdirSync(root, { recursive: true });
    const write = (details: Record<string, string | number | boolean | null>) => {
      appendFileSync(join(root, `process-${process.pid}.jsonl`), JSON.stringify({
        at_ms: Date.now(), pid: process.pid, sequence: count,
        ...(scope.getStore() ?? {}), ...details,
      }) + "\n");
      count++;
    };
    if (count >= limit) {
      if (!capReported) {
        write({ event: "diagnostic-cap-reached" });
        capReported = true;
      }
      if (!retainWorkspace || retainedWorkspaceCount >= retainedWorkspaceLimit) return;
      write({ event, ...fields });
      retainedWorkspaceCount++;
    } else write({ event, ...fields });
  } catch { /* Diagnostic availability must never change a business outcome. */ }
}

export function proofPath(raw: string) {
  const path = raw.split("?")[0].replace(/[0-9a-f]{32,}/gi, "opaque");
  if (["/api/v1/local-session", "/api/v1/shell/context", "/api/v1/crm/directory", "/api/v1/crm/directory/views"].includes(path)) return path;
  if (/^\/_next\/static\/[a-zA-Z0-9_./%\[\]@()+-]+$/.test(path)) return path.slice(0, 240);
  if (/^\/(api\/v1\/|customers|sites|schedule|my-jobs|service|documents|finance|crm|work|people|equipment)/.test(path) &&
      /^\/[a-zA-Z0-9_/-]+$/.test(path))
    return path.split("/").map(part => {
      if (!part || ["api", "v1", "customers", "sites", "local-session", "render-jobs", "report-render-jobs", "retry", "packs", "reports", "my-jobs", "schedule", "service", "work-orders", "appointments", "documents", "finance", "crm", "opportunities", "work", "people", "equipment", "activities", "workspace"].includes(part)) return part;
      return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part) ? ":id" : ":other";
    }).join("/").slice(0, 160);
  return path === "/" ? "/" : "/other";
}
