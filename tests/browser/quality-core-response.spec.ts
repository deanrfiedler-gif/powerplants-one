import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { waitForSampleCoreResponse } from "../../scripts/quality-core-response";

test("a performance sample excludes an earlier GET even when its response arrives first", async ({ page }) => {
  const previousStarted = Promise.withResolvers<void>();
  const releasePrevious = Promise.withResolvers<void>();
  let reads = 0;
  const server = createServer(async (request, response) => {
    if (request.url === "/api/v1/core") {
      const wave = ++reads;
      if (wave === 1) {
        previousStarted.resolve();
        await releasePrevious.promise;
      }
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ wave }));
    } else {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end("SYN performance fixture");
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    await page.evaluate(() => { void fetch("/api/v1/core"); });
    await previousStarted.promise;
    const pending = waitForSampleCoreResponse(page, "/api/v1/core", 5000);
    const previousResponse = page.waitForResponse(response => response.url().endsWith("/api/v1/core"));
    releasePrevious.resolve();
    await (await previousResponse).finished();
    await page.evaluate(async () => { await (await fetch("/api/v1/core")).json(); });
    expect(await (await pending).json()).toEqual({ wave: 2 });
    expect(reads).toBe(2);
  } finally {
    releasePrevious.resolve();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test("a current failed GET remains the measured response and commands do not satisfy it", async ({ page }) => {
  let commands = 0;
  const server = createServer((request, response) => {
    if (request.url === "/api/v1/core") {
      if (request.method === "POST") commands++;
      response.writeHead(request.method === "GET" ? 503 : 200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ method: request.method }));
    } else {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end("SYN performance fixture");
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    const pending = waitForSampleCoreResponse(page, "/api/v1/core", 5000);
    await page.evaluate(async () => {
      await (await fetch("/api/v1/core", { method: "POST" })).json();
      await (await fetch("/api/v1/core")).json();
    });
    const response = await pending;
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ method: "GET" });
    expect(commands).toBe(1);
    await expect(waitForSampleCoreResponse(page, "/never-requested", 100)).rejects.toThrow(/Timeout/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
