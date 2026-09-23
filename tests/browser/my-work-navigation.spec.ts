import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { navigateToMyWork } from "../helpers/my-work-navigation";

for (const path of ["/work", "/work/actions"]) {
  test(`My Work layout waits for its initial data before rendering: ${path}`, async ({ page }) => {
    const endpoint = path === "/work" ? "/api/v1/work/overview" : "/api/v1/work/actions";
    let completed = false;
    const server = createServer(async (request, response) => {
      if (request.url?.startsWith(endpoint)) {
        // Longer than the unchanged five-second render assertion. An unrelated
        // successful response below must not satisfy the readiness observer.
        await new Promise(resolve => setTimeout(resolve, 6000));
        completed = true;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end('{"fixture":"SYN"}');
      } else if (request.url === "/api/v1/unrelated") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end("{}");
      } else {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(`<h1>My Work</h1><div class="mw-page" aria-busy="true">Loading</div>
          <script>fetch('/api/v1/unrelated'); fetch('${endpoint}?scope=synthetic')
            .then(r => r.json()).then(() => {
              document.querySelector('.mw-page').setAttribute('aria-busy', 'false');
            });</script>`);
      }
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      await navigateToMyWork(page, `http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`);
      await expect(page.locator(".mw-page")).toHaveAttribute("aria-busy", "false");
      expect(completed).toBe(true);
    } finally {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
}

test("My Work readiness rejects an unsuccessful initial data response", async ({ page }) => {
  await page.route("http://my-work.test/**", route => route.fulfill({
    status: route.request().url().includes("/api/v1/") ? 503 : 200,
    contentType: "text/html",
    body: '<script>fetch("/api/v1/work/overview")</script>',
  }));
  await expect(navigateToMyWork(page, "http://my-work.test/work")).rejects.toThrow("initial read");
});
