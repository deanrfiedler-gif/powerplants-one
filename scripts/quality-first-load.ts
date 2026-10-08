import assert from "node:assert/strict";
import { chromium, expect, type Page, type BrowserContext } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { performanceFixtureFingerprint } from "./quality-performance-fixture";
import { waitForSampleCoreResponse } from "./quality-core-response";
import { closeDatabase } from "../src/platform/database";

// Deliberately one browser, sequential contexts. This is diagnostic evidence,
// not a replacement for PT-27's independent ten-browser CI procedure.
const label = process.argv[2];
assert.match(label ?? "", /^[a-z-]+$/);
const compiled = process.env.PPO_COMPILED_SOURCE;
assert.match(compiled ?? "", /^[0-9a-f]{40}$/);
assert.equal(process.env.PPO_PROOF_DIAGNOSTICS, "1");
const root = `verification-evidence/customer-first-load/${label}`;
await mkdir(root, { recursive: true });
const baseline = JSON.parse(await readFile("verification-evidence/customer-loading-diagnosis/fixture.json", "utf8"));
const fixture = await performanceFixtureFingerprint();
assert.deepEqual(fixture, baseline.fixture);
execFileSync("git", ["diff", "--exit-code", compiled!, "--", "src", "db", "public", "package.json", "package-lock.json", "scripts/build-offline.ts", "next.config.ts"]);
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
const manifestText = await readFile(".next/server/app/(business)/customers/page_client-reference-manifest.js", "utf8");
const scope = { globalThis: {} as { __RSC_MANIFEST?: Record<string, unknown> } };
runInNewContext(manifestText, scope);
await writeFile(`${root}/customer-client-manifest.json`, JSON.stringify(scope.globalThis.__RSC_MANIFEST, null, 2));
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3034"}`;
const server = spawn(process.execPath, ["--env-file=.env.local", "--import", "tsx", "scripts/local-server.ts", "--compiled"], { stdio: "inherit" });
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const samples: unknown[] = [];
const recordVisits: unknown[] = [];
const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
async function settled(page: Page) {
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false", { timeout: 120000 });
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0, { timeout: 120000 });
  await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function checkpoint(complete: boolean) {
  await writeFile(`${root}/results.json`, JSON.stringify({ complete, label, source_head: source, compiled_source: compiled, build_id: buildId, browser: browser?.version(), server_pid: server.pid, fixture, samples, record_visits: recordVisits, limits: "One Chrome process; three sequential fresh contexts per viewport with one cold and one warm Customers visit, then actual record navigation. 40ms latency, 1.25MB/s download and 625kB/s upload. Precise JS/CSS coverage, CDP and opt-in server diagnostics add overhead. Separate from ten-user CI, hosted/device acceptance and causal attribution of an entire loading delay. No credentials, request bodies or full headers retained." }, null, 2));
}
try {
  let ready = false;
  for (let i = 0; i < 240; i++) {
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, "Compiled server readiness within 120 seconds");
  browser = await chromium.launch({ channel: "chrome" });
  for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "phone", width: 390, height: 844 }]) {
    for (let cycle = 0; cycle < 3; cycle++) {
      const context: BrowserContext = await browser.newContext({ viewport, isMobile: viewport.name === "phone", hasTouch: viewport.name === "phone" });
      assert.equal((await context.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile: "coordinator" } })).status(), 200);
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      const conditions = { offline: false, latency: 40, downloadThroughput: 1250000, uploadThroughput: 625000, connectionType: "wifi" as const };
      await cdp.send("Network.emulateNetworkConditionsByRule", { offline: false, matchedNetworkConditions: [{ urlPattern: "", ...conditions }] });
      await cdp.send("Network.overrideNetworkState", conditions);
      for (let wave = 0; wave < 2; wave++) {
        const network = new Map<string, Record<string, unknown>>();
        let start = 0;
        const sent = (e: { requestId: string; timestamp: number; type?: string; request: { url: string; method: string } }) => {
          if (e.type === "Document" && !start) start = e.timestamp;
          if (!start) return;
          network.set(e.requestId, { path: new URL(e.request.url).pathname, type: e.type, method: e.request.method, start_ms: 1000 * (e.timestamp - start) });
        };
        const response = (e: { requestId: string; timestamp: number; response: { status: number; headers: Record<string, string>; fromDiskCache?: boolean; timing?: unknown } }) => {
          const row = network.get(e.requestId), proof = Object.entries(e.response.headers).find(([key]) => key.toLowerCase() === "x-ppo-proof-request")?.[1];
          if (row) Object.assign(row, { response_ms: 1000 * (e.timestamp - start), status: e.response.status, disk_cache: e.response.fromDiskCache ?? false, timing: e.response.timing, ...(proof && /^\d+$/.test(proof) ? { proof_request_id: Number(proof) } : {}) });
        };
        const finished = (e: { requestId: string; timestamp: number; encodedDataLength: number }) => {
          const row = network.get(e.requestId);
          if (row) Object.assign(row, { finish_ms: 1000 * (e.timestamp - start), encoded_bytes: e.encodedDataLength });
        };
        const failed = (e: { requestId: string; timestamp: number; errorText: string }) => {
          const row = network.get(e.requestId);
          if (row) Object.assign(row, { finish_ms: 1000 * (e.timestamp - start), error: e.errorText });
        };
        cdp.on("Network.requestWillBeSent", sent); cdp.on("Network.responseReceived", response); cdp.on("Network.loadingFinished", finished); cdp.on("Network.loadingFailed", failed);
        await page.coverage.startJSCoverage();
        await page.coverage.startCSSCoverage();
        const begin = performance.now();
        const pending = waitForSampleCoreResponse(page, "/api/v1/crm/directory");
        void pending.catch(() => undefined);
        try {
          await page.goto(`${origin}/customers`, { waitUntil: "domcontentloaded", timeout: 120000 });
          const loaded = await pending;
          assert.equal(loaded.status(), 200);
          const { observed_at: ignored, ...data } = await loaded.json(); void ignored;
          assert.equal(createHash("sha256").update(JSON.stringify(data)).digest("hex"), baseline.expected_sha256);
          await settled(page);
          const readyMs = performance.now() - begin;
          assert.deepEqual(await page.locator(viewport.name === "phone" ? ".crm-directory-mobile-main strong" : ".crm-directory-table tbody th a").allTextContents(), data.items.map((item: { display_name: string }) => item.display_name));
          const coverage = (entries: { url: string; text?: string; ranges: { start: number; end: number }[] }[]) => entries.filter(e => e.url.startsWith(origin)).map(e => ({ path: new URL(e.url).pathname, source_utf16_chars: e.text?.length ?? 0, source_sha256: createHash("sha256").update(e.text ?? "").digest("hex"), used_utf16_chars: e.ranges.reduce((sum, r) => sum + r.end - r.start, 0), ranges: e.ranges }));
          const js = (await page.coverage.stopJSCoverage()).filter(e => e.url.startsWith(origin)).map(e => ({ path: new URL(e.url).pathname, source_utf16_chars: e.source?.length ?? 0, source_sha256: createHash("sha256").update(e.source ?? "").digest("hex"), functions: e.functions }));
          const css = coverage(await page.coverage.stopCSSCoverage());
          const rows = [...network.values()];
          assert.equal(rows.filter(r => r.path === "/api/v1/crm/directory" && r.method === "GET").length, 1);
          samples.push({ viewport: viewport.name, cycle, wave, ready_ms: readyMs, network: rows, js_coverage: js, css_coverage: css });
          await checkpoint(false);
        } catch (error) {
          await writeFile(`${root}/failure-${viewport.name}-${cycle}-${wave}.json`, JSON.stringify({ viewport: viewport.name, cycle, wave, error: error instanceof Error ? error.message : String(error), network: [...network.values()] }, null, 2));
          throw error;
        } finally {
          cdp.off("Network.requestWillBeSent", sent); cdp.off("Network.responseReceived", response); cdp.off("Network.loadingFinished", finished); cdp.off("Network.loadingFailed", failed);
        }
      }
      const record = page.locator(viewport.name === "phone" ? ".crm-directory-mobile-main" : ".crm-directory-table tbody th a").first();
      const href = await record.getAttribute("href"); assert.ok(href);
      const target = new URL(href, origin), begin = performance.now();
      const pending = waitForSampleCoreResponse(page, `/api/v1${target.pathname}/workspace`); void pending.catch(() => undefined);
      if (viewport.name === "phone") await record.tap(); else await record.click();
      const result = await pending; assert.equal(result.status(), 200);
      const data = await result.json(); assert.equal(data.context.id, target.pathname.split("/").at(-1));
      await expect(page).toHaveURL(target.href);
      await expect(page.getByRole("heading", { name: data.context.display_name, exact: true }).first()).toBeVisible();
      await settled(page);
      recordVisits.push({ viewport: viewport.name, cycle, path: target.pathname, ready_ms: performance.now() - begin, status: result.status() });
      await checkpoint(false);
      await context.close();
    }
  }
  assert.equal(samples.length, 12); assert.equal(recordVisits.length, 6);
  assert.deepEqual(await performanceFixtureFingerprint(), fixture);
  await checkpoint(true);
  console.log(JSON.stringify({ label, samples: samples.length, record_visits: recordVisits.length, build_id: buildId }));
} finally {
  await browser?.close();
  try {
    await writeFile(`${root}/gateway.jsonl`, await readFile(`verification-evidence/transport-diagnostics/process-${server.pid}.jsonl`));
  } catch (error) {
    console.error("Gateway retention failed", error instanceof Error ? error.message : String(error));
  } finally {
    server.kill();
    await closeDatabase();
  }
}
