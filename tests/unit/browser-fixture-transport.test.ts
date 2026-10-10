import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { request } from "@playwright/test";
import { browserFixtureCall } from "../helpers/browser-fixture-call";

test("browser fixture requests own connections, retain cookies and propagate a lost response without retry", async () => {
  const received: { port: number; method: string; path: string; cookie?: string; origin?: string; body: string }[] = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    received.push({ port: req.socket.remotePort!, method: req.method!, path: req.url!, cookie: req.headers.cookie, origin: req.headers.origin, body });
    if (req.url === "/api/v1/lost") { req.socket.destroy(); return; }
    if (req.url === "/api/v1/unavailable") {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "SYN unavailable" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": "fixture=retained; Path=/; HttpOnly" });
    res.end(JSON.stringify({ ordinal: received.length }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const context = await request.newContext({ baseURL: `http://127.0.0.1:${port}` });
  try {
    const page = { request: context };
    assert.deepEqual(await browserFixtureCall(page, "first"), { ordinal: 1 });
    assert.deepEqual(await browserFixtureCall(page, "second"), { ordinal: 2 });
    assert.deepEqual(await browserFixtureCall(page, "save", { value: "SYN exact request" }, `http://127.0.0.1:${port}`), { ordinal: 3 });
    assert.equal(new Set(received.map(r => r.port)).size, 3, "each fixture request has its own connection");
    assert.deepEqual(received.map(({ port: _port, ...r }) => r), [
      { method: "GET", path: "/api/v1/first", cookie: undefined, origin: undefined, body: "" },
      { method: "GET", path: "/api/v1/second", cookie: "fixture=retained", origin: undefined, body: "" },
      { method: "POST", path: "/api/v1/save", cookie: "fixture=retained", origin: `http://127.0.0.1:${port}`, body: '{"value":"SYN exact request"}' },
    ]);
    await assert.rejects(browserFixtureCall(page, "lost", { profile: "technician" }), /apiRequestContext.fetch: socket hang up/);
    assert.equal(received.length, 4, "a command with a lost response is not repeated");
    assert.equal(received[3].method, "POST");
    assert.equal(received[3].body, '{"profile":"technician"}');
    assert.equal(received[3].cookie, "fixture=retained");
    await assert.rejects(browserFixtureCall(page, "unavailable"), /SYN unavailable/);
    assert.equal(received.length, 5, "a failed HTTP response is not retried or accepted");
  } finally {
    await context.dispose();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
