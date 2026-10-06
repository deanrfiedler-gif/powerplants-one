import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { request } from "@playwright/test";
import { crmRefinementCall } from "../helpers/crm-refinement-call";

test("CRM fixture requests own connections, retain cookies and propagate a lost response without retry", async () => {
  const received: { port: number; method: string; path: string; cookie?: string; body: string }[] = [];
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const part of req) body += part;
    received.push({ port: req.socket.remotePort!, method: req.method!, path: req.url!, cookie: req.headers.cookie, body });
    if (req.url === "/api/v1/lost") { req.socket.destroy(); return; }
    res.writeHead(200, { "Content-Type": "application/json", "Set-Cookie": "fixture=retained; Path=/; HttpOnly" });
    res.end(JSON.stringify({ ordinal: received.length }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const context = await request.newContext({ baseURL: `http://127.0.0.1:${port}` });
  try {
    const page = { request: context };
    assert.deepEqual(await crmRefinementCall(page, "first"), { ordinal: 1 });
    assert.deepEqual(await crmRefinementCall(page, "second"), { ordinal: 2 });
    assert.deepEqual(await crmRefinementCall(page, "save", { value: "SYN exact request" }), { ordinal: 3 });
    assert.equal(new Set(received.map(r => r.port)).size, 3, "each fixture request has its own connection");
    assert.deepEqual(received.map(({ port: _port, ...r }) => r), [
      { method: "GET", path: "/api/v1/first", cookie: undefined, body: "" },
      { method: "GET", path: "/api/v1/second", cookie: "fixture=retained", body: "" },
      { method: "POST", path: "/api/v1/save", cookie: "fixture=retained", body: '{"value":"SYN exact request"}' },
    ]);
    await assert.rejects(crmRefinementCall(page, "lost"), /apiRequestContext.fetch: socket hang up/);
    assert.equal(received.length, 4, "a failed request is not repeated");
  } finally {
    await context.dispose();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
