import { test, type Page, type Response } from "@playwright/test";

// Preserve the existing action/response deadlines and their failures. This
// observer distinguishes actionability, request, response and click completion.
export async function observedResponse(page: Page, label: string, matches: (response: Response) => boolean, action: () => Promise<unknown>) {
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
      page.waitForResponse(matches).then(r => { record("wait-resolved", r.status()); return r; }, error => { record("wait-rejected"); throw error; }),
      action().then(() => record("click-resolved"), error => { record("click-rejected"); throw error; }),
    ]);
    if (outcomes[0].status === "rejected") throw outcomes[0].reason;
    if (outcomes[1].status === "rejected") throw outcomes[1].reason;
    return outcomes[0].value;
  } finally {
    page.off("request", request).off("response", response).off("requestfinished", finished).off("requestfailed", failed);
    await test.info().attach(`${label}-lifecycle`, { body: JSON.stringify({ started_at_ms: at, events, boundary: "Original response and click timeouts; no retries or timeout extension; no request data retained." }, null, 2), contentType: "application/json" });
  }
}
