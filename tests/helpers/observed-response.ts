import { test, type Page, type Response } from "@playwright/test";

// A render retry is a synchronous controlled server command: the route claims
// the job with a two-minute lease (ppo.*_render_jobs.lease_until, see
// src/documents/worker.ts, src/reports/worker.ts, src/finance/worker.ts) and
// only answers once the durable output is verified. Its response is therefore
// bounded by that lease, not by the 15-second UI action budget that applies to
// the click itself. Retained CI evidence (run 34193761221) shows a successful
// pack render answered in 15,972 ms because the controlled Chromium launch took
// 12,877 ms on the loaded runner; the assertion on the answer is unchanged.
export const RENDER_LEASE_MS = 120_000;

// This observer distinguishes actionability, request, response and click
// completion; the click keeps its existing action timeout and failure.
export async function observedResponse(page: Page, label: string, matches: (response: Response) => boolean, action: () => Promise<unknown>, options: { timeout?: number } = {}) {
  const at = Date.now();
  const events: { event: string; elapsed_ms: number; status?: number }[] = [];
  const record = (event: string, status?: number) => {
    if (events.length < 80) events.push({ event, elapsed_ms: Date.now() - at, ...(status === undefined ? {} : { status }) });
  };
  // Only render-retry lifecycle metadata is retained; no URL, header or payload.
  const relevant = (url: string, method: string) => method === "POST" &&
    /\/api\/v1\/(report-)?render-jobs\/[^/?]+\/retry$/.test(new URL(url).pathname);
  const request = (r: import("@playwright/test").Request) => { if (relevant(r.url(), r.method())) record("retry-request"); };
  const response = (r: Response) => { if (relevant(r.url(), r.request().method())) record("retry-response", r.status()); };
  const finished = (r: import("@playwright/test").Request) => { if (relevant(r.url(), r.method())) record("retry-finished"); };
  const failed = (r: import("@playwright/test").Request) => { if (relevant(r.url(), r.method())) record("retry-failed"); };
  page.on("request", request).on("response", response).on("requestfinished", finished).on("requestfailed", failed);
  record("wait-start");
  try {
    const outcomes = await Promise.allSettled([
      page.waitForResponse(matches, options.timeout === undefined ? {} : { timeout: options.timeout }).then(r => { record("wait-resolved", r.status()); return r; }, error => { record("wait-rejected"); throw error; }),
      action().then(() => record("click-resolved"), error => { record("click-rejected"); throw error; }),
    ]);
    if (outcomes[0].status === "rejected") throw outcomes[0].reason;
    if (outcomes[1].status === "rejected") throw outcomes[1].reason;
    return outcomes[0].value;
  } finally {
    page.off("request", request).off("response", response).off("requestfinished", finished).off("requestfailed", failed);
    await test.info().attach(`${label}-lifecycle`, { body: JSON.stringify({ started_at_ms: at, events, response_timeout_ms: options.timeout ?? null, boundary: "Response wait bounded as declared above (render lease when given); click keeps its action timeout; no retries; no request data retained." }, null, 2), contentType: "application/json" });
  }
}
