import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { retainApiReadsForTeardown } from "../helpers/browser-read-drain";

test("teardown waits for a server read abandoned by navigation", async ({ page }) => {
  const started = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let readFinished = false;
  const server = createServer(async (request, response) => {
    if (request.url === "/api/v1/slow-read") {
      started.resolve();
      await release.promise;
      readFinished = true;
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end('{"fixture":"SYN"}');
    } else {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(request.url === "/" ? '<script>fetch("/api/v1/slow-read").catch(() => {})</script>' : "Next page");
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await retainApiReadsForTeardown(page);
    await page.goto(origin);
    await started.promise;
    await page.goto(`${origin}/next`);
    let drained = false;
    const drain = page.unrouteAll({ behavior: "wait" }).then(() => { drained = true; });
    // The server is explicitly held, so a completed drain here is a defect.
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(drained).toBe(false);
    expect(readFinished).toBe(false);
    release.resolve();
    await drain;
    expect(readFinished).toBe(true);
  } finally {
    release.resolve();
    await page.unrouteAll({ behavior: "wait" });
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
