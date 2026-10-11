import assert from "node:assert/strict";
import test from "node:test";
import { createServer, get } from "node:http";
import { once, EventEmitter } from "node:events";
import type { CDPSession } from "@playwright/test";
import { assetDiagnosticsAllowed, assetReleaseProbeAllowed, assetFailure, assetPath, assetSampleHeader, createAssetObserver, observeAssetNetwork } from "../../scripts/quality-asset-observer";

const env = { PPO_ASSET_DIAGNOSTICS: "1", PPO_ENV: "local-synthetic", PPO_EXPOSURE: "loopback",
  PPO_IDENTITY: "synthetic", NODE_ENV: "test", PPO_BENCHMARK_FIXTURE: "add-synthetic-load", PPO_COMPARISON_BLOCK: "cpu-assets-test" };

test("asset observations require compiled explicit synthetic scope and exclude arbitrary values", () => {
  assert.ok(assetDiagnosticsAllowed(env, true));
  assert.equal(assetReleaseProbeAllowed(env), false);
  assert.equal(assetReleaseProbeAllowed({ ...env, PPO_ASSET_RELEASE_PROBE: "1" }), false);
  assert.equal(assetReleaseProbeAllowed({ ...env, PPO_ASSET_RELEASE_PROBE: "1", PPO_COMPARISON_BLOCK: "cpu-assets-release-test" }), true);
  assert.equal(assetReleaseProbeAllowed({ ...env, PPO_ASSET_RELEASE_PROBE: "1", PPO_COMPARISON_BLOCK: "cpu-assets-release-test", PPO_EXPOSURE: "shared" }), false);
  assert.equal(assetDiagnosticsAllowed(env, false), false);
  for (const key of Object.keys(env).filter(k => k !== "NODE_ENV")) assert.equal(assetDiagnosticsAllowed({ ...env, [key]: undefined }, true), false);
  for (const override of [{ NODE_ENV: "production" }, { PPO_ENV: "azure-demo" }, { PPO_EXPOSURE: "shared" }, { PPO_COMPARISON_BLOCK: "cpu-core-test" }]) assert.equal(assetDiagnosticsAllowed({ ...env, ...override }, true), false);
  assert.equal(assetPath("/_next/static/chunks/abc-123.js?secret=PRIVATE"), "/_next/static/chunks/abc-123.js");
  for (const path of ["/api/v1/local-session", "/_next/static/chunks/../PRIVATE.js", "/_next/static/chunks/PRIVATE%20name.js"]) assert.equal(assetPath(path), null);
  assert.deepEqual(assetFailure("net::ERR_CONNECTION_RESET"), { error_code: "net::ERR_CONNECTION_RESET", canceled: false });
  assert.equal(assetFailure("PRIVATE message").error_code, "other");
});

test("real HTTP asset finish and incomplete close remain distinct without changing body or cache", async () => {
  const rows: Record<string, unknown>[] = [];
  let closedIncomplete!: () => void;
  const observedClose = new Promise<void>(resolve => { closedIncomplete = resolve; });
  const observe = createAssetObserver(env, true, row => {
    rows.push(row);
    if (row.sample === "phone-0-2" && row.event === "asset-closed") closedIncomplete();
  });
  const server = createServer((req, res) => {
    observe(req, res);
    assert.equal(req.headers[assetSampleHeader], undefined);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", "6");
    if (req.url?.includes("abort.js")) { res.write("12"); return; }
    res.end("123456");
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    const response = await fetch(origin + "/_next/static/chunks/ok.js?secret=PRIVATE", { headers: { [assetSampleHeader]: "desktop-0-7", Cookie: "PRIVATE" } });
    assert.equal(await response.text(), "123456");
    assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
    assert.equal(response.headers.get(assetSampleHeader), null);
    const finished = rows.find(row => row.event === "asset-finished");
    assert.equal(finished?.sample, "desktop-0-7"); assert.equal(finished?.declared_bytes, 6);
    assert.equal(finished?.writable_finished, true);
    const closed = new Promise<void>(resolve => server.once("close", () => resolve()));
    await new Promise<void>((resolve, reject) => {
      const req = get(origin + "/_next/static/chunks/abort.js", { headers: { [assetSampleHeader]: "phone-0-2" } }, res => {
        res.once("data", () => { res.destroy(); resolve(); });
      }); req.once("error", reject);
    });
    await observedClose;
    server.close(); server.closeAllConnections(); await closed;
    assert.ok(rows.some(row => row.sample === "phone-0-2" && row.event === "asset-closed" && row.writable_finished === false));
    assert.ok(!rows.some(row => row.sample === "phone-0-2" && row.event === "asset-finished"));
    assert.ok(!JSON.stringify(rows).includes("PRIVATE"));
  } finally { server.close(); server.closeAllConnections(); }
});

test("browser observation keeps bytes and failure state without copying unapproved CDP content", () => {
  const cdp = new EventEmitter(), network = new Map<string, Record<string, unknown>>([["a", {}]]);
  const stop = observeAssetNetwork(cdp as unknown as CDPSession, network, () => 10);
  cdp.emit("Network.dataReceived", { requestId: "a", timestamp: 10.2, dataLength: 20, encodedDataLength: 9, data: "PRIVATE" });
  cdp.emit("Network.loadingFailed", { requestId: "a", timestamp: 12, errorText: "PRIVATE exception", canceled: false });
  cdp.emit("Network.responseReceived", { requestId: "a", response: { protocol: "http/1.1", connectionId: 3, connectionReused: true,
    headers: { cookie: "PRIVATE" }, timing: { sendStart: 2, private: 4 } } });
  assert.equal(network.get("a")?.data_bytes, 20); assert.equal(network.get("a")?.error_code, "other");
  assert.equal(network.get("a")?.failed_ms, 2000);
  assert.deepEqual(network.get("a")?.response_timing, { sendStart: 2 });
  assert.ok(!JSON.stringify([...network.values()]).includes("PRIVATE"));
  stop(); assert.equal(cdp.listenerCount("Network.loadingFailed"), 0);
});
