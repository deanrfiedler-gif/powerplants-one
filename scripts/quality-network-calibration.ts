import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { chromium } from "@playwright/test";
import { calibrationIssues, installNetworkConditions, networkConditions, type CalibrationSample } from "./quality-network-conditioning";
import { observeAssetNetwork } from "./quality-asset-observer";

assert.equal(process.env.GITHUB_ACTIONS, "true", "Calibration is an explicit disposable CI experiment");
assert.equal(process.env.PPO_BLOCK_PROFILE, "cpu-assets-network");
assert.equal(process.platform, "linux");
assert.equal(availableParallelism(), 4, "Retain an unexpected runner; never silently change capacity");
const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(source, process.env.PPO_SOURCE_HEAD);
const root = "verification-evidence/pt27-network-calibration";
await mkdir("verification-evidence", { recursive: true });
await mkdir(root, { recursive: false });
const serverEvents: Record<string, unknown>[] = [];
const payload = (size: number) => Buffer.alloc(size, 97);
const sha = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");
const hashes = Object.fromEntries([250000, 2500000, 125000, 1250000, 500000].map(size => [size, sha(payload(size))]));
const css = Buffer.from("body{color:#123456}/*".padEnd(15998, " ") + "*/");
const js = Buffer.from("window.__ppoGraph=(window.__ppoGraph||0)+1;/*".padEnd(63998, " ") + "*/");
const graph = Buffer.from("<!doctype html><html><head>" + Array.from({ length: 8 }, (_, i) => `<link rel=stylesheet href=/asset/css/${i}>`).join("") +
  Array.from({ length: 13 }, (_, i) => `<script defer src=/asset/js/${i}></script>`).join("") + "</head><body>Independent synthetic transfer calibration</body></html>");
const server = createServer((req, res) => {
  const started = performance.now(), at = Date.now(), path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  const rawSample = req.headers["x-ppo-calibration-sample"];
  const sample = typeof rawSample === "string" && /^(none-a1|rule|global-b1|global-b2|none-a2)-(1|10)-[0-9]$/.test(rawSample) ? rawSample : null;
  const event: Record<string, unknown> = { sample, path: /^\/(tiny|graph|upload|download\/\d+|asset\/(css|js)\/\d+)$/.test(path) ? path : "other", at_ms: at, method: req.method };
  serverEvents.push(event);
  res.once("finish", () => Object.assign(event, { finished_ms: performance.now() - started, status: res.statusCode }));
  res.once("close", () => Object.assign(event, { closed_ms: performance.now() - started, writable_finished: res.writableFinished }));
  res.setHeader("Cache-Control", "no-store");
  const send = (body: Buffer, type: string) => { res.writeHead(200, { "Content-Type": type, "Content-Length": body.length }); res.end(body); };
  if (path === "/tiny" && req.method === "GET") return send(Buffer.from("ok"), "text/plain");
  if (path === "/graph" && req.method === "GET") return send(graph, "text/html");
  if (/^\/asset\/css\/[0-7]$/.test(path)) return send(css, "text/css");
  if (/^\/asset\/js\/(?:[0-9]|1[0-2])$/.test(path)) return send(js, "text/javascript");
  const size = Number(path.match(/^\/download\/(250000|2500000|500000)$/)?.[1]);
  if (size && req.method === "GET") return send(payload(size), "application/octet-stream");
  if (path === "/upload" && req.method === "POST") {
    let bytes = 0; const hash = createHash("sha256");
    req.on("data", (chunk: Buffer) => { bytes += chunk.length; if (bytes > 1250000) { req.destroy(); return; } hash.update(chunk); });
    req.on("end", () => {
      Object.assign(event, { body_bytes: bytes, body_sha256: hash.digest("hex"), body_complete_ms: performance.now() - started });
      send(Buffer.from(JSON.stringify({ bytes, sha256: event.body_sha256 })), "application/json");
    });
    return;
  }
  res.writeHead(404); res.end();
});
await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address(); assert.ok(address && typeof address !== "string");
const origin = `http://127.0.0.1:${address.port}`;
const cohorts: Record<string, unknown>[] = [];
let browserVersion: string | undefined;
const protocol = { source, started_at: new Date().toISOString(), node: process.version, platform: process.platform,
  logical_cpus: availableParallelism(), conditions: networkConditions, cohorts, passed: false, browser: "",
  criteria: "ADR-0052: exact bytes; both global repeats and both unthrottled anchors at one/ten browsers; original rule retained without determining candidate gate; no retries or substituted cohorts." };
await writeFile(`${root}/protocol.json`, JSON.stringify(protocol, null, 2));
try {
  for (const method of ["none-a1", "rule", "global-b1", "global-b2", "none-a2"] as const) {
    for (const users of [1, 10]) {
      const browsers: Awaited<ReturnType<typeof chromium.launch>>[] = [];
      const samples: (CalibrationSample & Record<string, unknown>)[] = [];
      const cohort = { method, users, samples, complete: false, passed: false };
      cohorts.push(cohort);
      try {
        // Retain every successfully launched owned browser even if another launch fails.
        const launches = await Promise.allSettled(Array.from({ length: users }, async () => {
          const b = await chromium.launch({ channel: "chrome" }); browsers.push(b); return b;
        }));
        assert.ok(launches.every(r => r.status === "fulfilled"), "Original browser launch failed");
        for (const b of browsers) { browserVersion ??= b.version(); assert.equal(b.version(), browserVersion); }
        protocol.browser = browserVersion!;
        await Promise.all(browsers.map(async (browser, user) => {
          const sampleKey = `${method}-${users}-${user}`;
          const sample: CalibrationSample & Record<string, unknown> = { sample: sampleKey, user, method, started_at_ms: Date.now(), stage: "context" };
          samples.push(sample);
          const mobile = users === 10 && user >= 5;
          const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
          const page = await context.newPage(); page.setDefaultTimeout(120000);
          await page.setExtraHTTPHeaders({ "x-ppo-calibration-sample": sampleKey });
          const cdp = await context.newCDPSession(page); await cdp.send("Network.enable");
          const network = new Map<string, Record<string, unknown>>(); let start = 0;
          cdp.on("Network.requestWillBeSent", e => {
            if (!start) start = e.timestamp;
            network.set(e.requestId, { path: new URL(e.request.url).pathname, method: e.request.method, type: e.type, start_ms: 1000 * (e.timestamp - start) });
          });
          cdp.on("Network.responseReceived", e => { const row = network.get(e.requestId); if (row) Object.assign(row, { status: e.response.status, response_ms: 1000 * (e.timestamp - start) }); });
          cdp.on("Network.loadingFinished", e => { const row = network.get(e.requestId); if (row) Object.assign(row, { finish_ms: 1000 * (e.timestamp - start), encoded_bytes: e.encodedDataLength }); });
          const stop = observeAssetNetwork(cdp, network, () => start);
          try {
            if (!method.startsWith("none")) sample.rule_id = await installNetworkConditions(cdp, method === "rule" ? "rule" : "global");
            sample.stage = "asset-graph"; const graphStart = performance.now();
            await page.goto(origin + "/graph", { waitUntil: "load", timeout: 120000 });
            sample.graph = await page.evaluate(() => ({ scripts: (window as unknown as { __ppoGraph: number }).__ppoGraph, stylesheets: document.styleSheets.length }));
            sample.graph_ms = performance.now() - graphStart;
            sample.stage = "tiny";
            sample.latency = [];
            for (let i = 0; i < 5; i++) sample.latency.push(await page.evaluate(async () => {
              const began = performance.now(); const r = await fetch("/tiny", { cache: "no-store", signal: AbortSignal.timeout(120000) });
              const elapsed = performance.now() - began; if (r.status !== 200 || await r.text() !== "ok") throw Error("tiny-payload-mismatch"); return elapsed;
            }));
            for (const direction of ["download", "upload"] as const) {
              sample.stage = direction; sample[direction] = [];
              for (const size of direction === "download" ? [250000, 2500000] : [125000, 1250000]) {
                const result = await page.evaluate(async ({ direction, size, expected }) => {
                  const body = direction === "upload" ? new Uint8Array(size).fill(97) : undefined;
                  const began = performance.now();
                  const r = await fetch(direction === "upload" ? "/upload" : `/download/${size}`, {
                    method: direction === "upload" ? "POST" : "GET", body, cache: "no-store", signal: AbortSignal.timeout(120000),
                  });
                  const received = await r.arrayBuffer(), elapsed = performance.now() - began;
                  if (r.status !== 200) throw Error("unexpected-probe-status");
                  if (direction === "upload") {
                    const data = JSON.parse(new TextDecoder().decode(received));
                    return { elapsed_ms: elapsed, bytes: size, exact: data.bytes === size && data.sha256 === expected };
                  }
                  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", received))).map(x => x.toString(16).padStart(2, "0")).join("");
                  return { elapsed_ms: elapsed, bytes: received.byteLength, exact: received.byteLength === size && digest === expected };
                }, { direction, size, expected: hashes[size] });
                sample[direction].push(result);
              }
            }
            sample.stage = "parallel";
            sample.parallel = await page.evaluate(async expected => {
              const began = performance.now();
              const buffers = await Promise.all(Array.from({ length: 6 }, async (_, i) => {
                const r = await fetch(`/download/500000?parallel=${i}`, { cache: "no-store", signal: AbortSignal.timeout(120000) });
                if (r.status !== 200) throw Error("unexpected-parallel-status"); return r.arrayBuffer();
              }));
              const elapsed = performance.now() - began;
              const digests = await Promise.all(buffers.map(async b => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b))).map(x => x.toString(16).padStart(2, "0")).join("")));
              return { elapsed_ms: elapsed, bytes: buffers.reduce((n, b) => n + b.byteLength, 0), exact: buffers.every(b => b.byteLength === 500000) && digests.every(d => d === expected) };
            }, hashes[500000]);
            sample.stage = "complete";
          } catch (error) {
            sample.error = error instanceof Error ? error.message : "unknown-probe-error";
          } finally {
            sample.finished_at_ms = Date.now(); sample.network = structuredClone([...network.values()]); stop();
            sample.issues = calibrationIssues(sample, !method.startsWith("none"));
            await writeFile(`${root}/${sampleKey}.json`, JSON.stringify(sample, null, 2), { flag: "wx" });
            await context.close();
          }
        }));
        cohort.complete = samples.length === users;
        cohort.passed = cohort.complete && samples.every(s => (s.issues as string[]).length === 0);
      } finally {
        await Promise.all(browsers.map(b => b.close()));
        await writeFile(`${root}/protocol.json`, JSON.stringify(protocol, null, 2));
        await writeFile(`${root}/server.json`, JSON.stringify(serverEvents, null, 2));
        console.log(JSON.stringify({ method, users, complete: cohort.complete, passed: cohort.passed,
          failures: samples.filter(s => (s.issues as string[] | undefined)?.length).map(s => ({ sample: s.sample, stage: s.stage, issues: s.issues })) }));
      }
    }
  }
  protocol.passed = cohorts.length === 10 && cohorts.filter(c => c.method !== "rule").every(c => c.passed);
  await writeFile(`${root}/protocol.json`, JSON.stringify(protocol, null, 2));
  assert.ok(protocol.passed, "Retain failed calibration; do not measure the application");
} finally {
  server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  await writeFile(`${root}/server.json`, JSON.stringify(serverEvents, null, 2));
}
