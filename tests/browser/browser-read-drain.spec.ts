import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { drainApiReadsForTeardown, finishApiReadsForTeardown, retainApiReadsForTeardown } from "../helpers/browser-read-drain";

for (const abandonment of ["navigation", "AbortController", "teardown navigation"] as const) {
  test(`teardown waits for overlapping server reads abandoned by ${abandonment}`, async ({ page }) => {
    const started = Promise.withResolvers<void>();
    const releases = [Promise.withResolvers<void>(), Promise.withResolvers<void>()];
    let readsStarted = 0, readsFinished = 0;
    const server = createServer(async (request, response) => {
      if (request.url?.startsWith("/api/v1/slow-read")) {
        if (++readsStarted === 2) started.resolve();
        const index = Number(new URL(request.url, "http://fixture.test").searchParams.get("index"));
        await releases[index].promise;
        readsFinished++;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end('{"fixture":"SYN"}');
      } else {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(request.url === "/" ? '<script>window.readAbort = new AbortController(); for (const index of [0, 1]) fetch("/api/v1/slow-read?index=" + index, { signal: window.readAbort.signal }).catch(() => {})</script>' : "Next page");
      }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      await retainApiReadsForTeardown(page);
      await page.goto(origin);
      await started.promise;
      if (abandonment === "navigation") {
        await page.goto(`${origin}/next`);
      } else if (abandonment === "AbortController") {
        const failed = page.waitForEvent("requestfailed", request => request.url().includes("/api/v1/slow-read"));
        await page.evaluate(() => (window as unknown as { readAbort: AbortController }).readAbort.abort());
        await failed;
      }
      let drained = false;
      const drain = (async () => {
        await finishApiReadsForTeardown(page);
        drained = true;
      })();
      // The server is explicitly held, so a completed drain here is a defect.
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(drained).toBe(false);
      expect(readsFinished).toBe(0);
      releases[0].resolve();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(drained).toBe(false);
      releases[1].resolve();
      await drain;
      expect(readsStarted).toBe(2);
      expect(readsFinished).toBe(2);
    } finally {
      for (const release of releases) release.resolve();
      await drainApiReadsForTeardown(page);
      await page.unrouteAll({ behavior: "wait" });
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
}
