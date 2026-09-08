import { test as base, expect, type Request } from "@playwright/test";
import { proofPath } from "../../src/platform/proof-diagnostics";
import { runtimeSampler } from "../../src/platform/proof-runtime";
import type { Page } from "@playwright/test";

const apiObservers = new WeakMap<Page, (path: string, call: () => Promise<unknown>) => Promise<unknown>>();
export function observeApiCall<T>(page: Page, path: string, call: () => Promise<T>): Promise<T> {
  const observe = apiObservers.get(page);
  return observe ? observe(path, call) as Promise<T> : call();
}

// Observe existing Playwright events without another CDP session, interception,
// browser flags, network rules, liveness probes, retries or timeout changes.
export const test = base.extend<{ lifecycleEvidence: void }>({
  lifecycleEvidence: [async ({ page }, runTest, info) => {
    if (process.env.PPO_PROOF_DIAGNOSTICS !== "1") return runTest();
    const started = Date.now();
    const events: Record<string, unknown>[] = [];
    const requests = new WeakMap<Request, number>();
    const limit = 12000;
    let requestId = 0, dropped = 0;
    const record = (event: string, fields: Record<string, unknown> = {}) => {
      if (events.length < limit) events.push({ event, elapsed_ms: Date.now() - started, ...fields });
      else dropped++;
    };
    apiObservers.set(page, async (path, call) => {
      const id = ++requestId;
      record("api-request", { request_id: id, path: proofPath(path) });
      try {
        const result = await call();
        record("api-resolved", { request_id: id });
        return result;
      } catch (error) {
        record("api-rejected", { request_id: id });
        throw error;
      }
    });
    const request = (r: Request) => {
      const id = ++requestId;
      requests.set(r, id);
      let path = "/other";
      try {
        const url = new URL(r.url());
        if (url.origin === "http://127.0.0.1:3000" && !url.username && !url.password)
          path = proofPath(url.pathname);
      } catch { /* Retain only the fixed unknown-path category. */ }
      record("request", { request_id: id, path, method: r.method() === "GET" ? "GET" : r.method() === "POST" ? "POST" : "other" });
    };
    const response = (r: import("@playwright/test").Response) => record("response", { request_id: requests.get(r.request()) ?? 0, status: r.status() });
    const finished = (r: Request) => record("request-finished", { request_id: requests.get(r) ?? 0 });
    const failed = (r: Request) => record("request-failed", { request_id: requests.get(r) ?? 0 });
    const dom = () => record("dom-content-loaded");
    const loaded = () => record("page-load");
    const error = () => record("page-error");
    const crashed = () => record("page-crash");
    page.on("request", request).on("response", response).on("requestfinished", finished).on("requestfailed", failed)
      .on("domcontentloaded", dom).on("load", loaded).on("pageerror", error).on("crash", crashed);
    const sample = runtimeSampler();
    const heartbeat = setInterval(() => record("test-runtime", sample()), 2000);
    heartbeat.unref();
    try {
      await runTest();
    } finally {
      apiObservers.delete(page);
      clearInterval(heartbeat);
      page.off("request", request).off("response", response).off("requestfinished", finished).off("requestfailed", failed)
        .off("domcontentloaded", dom).off("load", loaded).off("pageerror", error).off("crash", crashed);
      record("test-end", { status: info.status ?? "unknown" });
      await info.attach("browser-lifecycle", {
        body: JSON.stringify({ started_at_ms: started, pid: process.pid, event_limit: limit, dropped_events: dropped, events,
          boundary: "Existing page events and numeric runtime observations only; no headers, queries, bodies, error text or raw traces. Observations do not replace assertions." }),
        contentType: "application/json",
      });
    }
  }, { auto: true }],
});
export { expect };
