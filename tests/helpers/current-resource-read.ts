import type { Page, Request, Response } from "@playwright/test";

// A successful older GET may be ineligible for useCrmResource after a focus or
// interval refresh. Wait for the latest observed read, without hiding refusals
// or retrying requests. The caller still checks its response and rendered UI.
export function currentResourceRead(page: Page, path: string) {
  type Read = { request: Request; superseded: ReturnType<typeof Promise.withResolvers<void>> };
  let latest: Read | undefined;
  const requested = (request: Request) => {
    if (request.method() === "GET" && new URL(request.url()).pathname === path) {
      latest?.superseded.resolve();
      latest = { request, superseded: Promise.withResolvers<void>() };
    }
  };
  page.on("request", requested);
  return {
    async finished(): Promise<Response> {
      if (!latest) throw new Error("No resource read was observed");
      for (;;) {
        const current: Read = latest;
        const result = await Promise.race([
          current.request.response().then(async response => ({
            response, failure: response ? await response.finished() : true,
          })).catch(() => ({ response: null, failure: true })),
          current.superseded.promise.then(() => null),
        ]);
        if (current !== latest) continue;
        if (!result?.response || result.failure) throw new Error("Current resource read did not complete");
        return result.response;
      }
    },
    dispose() {
      page.off("request", requested);
      latest?.superseded.resolve();
    },
  };
}
