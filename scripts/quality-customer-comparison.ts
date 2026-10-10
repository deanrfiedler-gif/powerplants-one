import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { freemem, totalmem } from "node:os";
import { chromium, expect, type Page } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import { performanceFixtureFingerprint } from "./quality-performance-fixture";
import { waitForSampleCoreResponse } from "./quality-core-response";

// Bounded Customers diagnostic, separate from the complete four-view PT-27 run.
// Ten browser processes and unchanged network/readiness limits. Original results
// are written after every wave; a failed run is never silently retried.
const label = process.argv[2];
assert.match(label ?? "", /^[a-z][a-z0-9-]+$/);
const root = `verification-evidence/pt27-loading/${label}`;
await mkdir(root, { recursive: false });
const expected = JSON.parse(await readFile("verification-evidence/customer-loading-diagnosis/fixture.json", "utf8"));
const compiledSource = process.env.PPO_COMPILED_SOURCE;
assert.match(compiledSource ?? "", /^[0-9a-f]{40}$/);
execFileSync("git", ["diff", "--exit-code", compiledSource!, "--", "src", "db", "public", "package.json", "package-lock.json", "scripts/build-offline.ts", "next.config.ts"]);
const fixture = await performanceFixtureFingerprint();
assert.deepEqual(fixture, expected.fixture);
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
const origin = localConfig().origin;
const server = spawn(process.execPath, ["--env-file=.env.local", "--import", "tsx", "scripts/local-server.ts", "--compiled"], { stdio: "inherit" });
const browsers: Awaited<ReturnType<typeof chromium.launch>>[] = [];
const samples: Record<string, unknown>[] = [];
const visits: Record<string, unknown>[] = [];
const errors: string[] = [];
const metadata = {
  label, source: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  compiled_source: compiledSource, build_id: buildId, server_pid: server.pid,
  node: process.version, platform: process.platform, memory_bytes: totalmem(),
  network: { latency_ms: 40, download_bytes_per_second: 1250000, upload_bytes_per_second: 625000 },
  fixture, target_ms: 3000,
  limits: "Customers only; ten independent headless Chrome processes, four waves per viewport and one actual record activation per user/viewport. Fresh browser contexts for the cold wave, three warm repeats, retained database/OS caches. Local shared host, no physical-device, hosted, screen-reader or whole PT-27 acceptance. CDP path/status/transfer observations and optional gateway logging add overhead. Fonts/Kit use this build's normal configuration; no network request is exempted.",
};
async function checkpoint(complete: boolean) {
  await writeFile(`${root}/results.json`, JSON.stringify({ ...metadata, complete, browser: browsers[0]?.version(), samples, record_visits: visits, errors }, null, 2));
}
async function settled(page: Page) {
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false", { timeout: 120000 });
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  await expect(page.getByText(/^Loading .*â€¦$/)).toHaveCount(0, { timeout: 120000 });
  await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}
try {
  let ready = false;
  for (let n = 0; n < 240; n++) {
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  assert.ok(ready, "Owned compiled server must start within 120 seconds");
  browsers.push(...await Promise.all(Array.from({ length: 10 }, () => chromium.launch({ channel: "chrome" }))));
  for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "phone", width: 390, height: 844 }]) {
    const contexts = await Promise.all(browsers.map(b => b.newContext({ viewport, isMobile: viewport.name === "phone", hasTouch: viewport.name === "phone", locale: "en-AU" })));
    for (const context of contexts) assert.equal((await context.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile: "coordinator" } })).status(), 200);
    const pages = await Promise.all(contexts.map(c => c.newPage()));
    const sessions = await Promise.all(pages.map(p => p.context().newCDPSession(p)));
    const rules: string[] = [];
    for (const cdp of sessions) {
      await cdp.send("Network.enable");
      const conditions = { offline: false, latency: 40, downloadThroughput: 1250000, uploadThroughput: 625000, connectionType: "wifi" as const };
      const { ruleIds } = await cdp.send("Network.emulateNetworkConditionsByRule", { offline: false, matchedNetworkConditions: [{ urlPattern: "", ...conditions }] });
      rules.push(ruleIds[0]);
      await cdp.send("Network.overrideNetworkState", conditions);
    }
    for (let wave = 0; wave < 4; wave++) {
      const outcomes = await Promise.allSettled(pages.map(async (page, user) => {
        const cdp = sessions[user], network = new Map<string, Record<string, unknown>>(), applied = new Map<string, string>();
        let start = 0;
        const sent = (e: { requestId: string; timestamp: number; type?: string; request: { url: string; method: string; headers: Record<string, string> } }) => {
          if (e.type === "Document" && !start) start = e.timestamp;
          if (!start) return;
          network.set(e.requestId, { path: new URL(e.request.url).pathname, type: e.type, method: e.request.method, start_ms: 1000 * (e.timestamp - start), prefetch: Object.entries(e.request.headers).some(([k, v]) => k.toLowerCase() === "next-router-prefetch" && v === "1") });
        };
        const responded = (e: { requestId: string; timestamp: number; response: { status: number; headers: Record<string, string> } }) => {
          const row = network.get(e.requestId), id = Object.entries(e.response.headers).find(([k]) => k.toLowerCase() === "x-ppo-proof-request")?.[1];
          if (row) Object.assign(row, { response_ms: 1000 * (e.timestamp - start), status: e.response.status, ...(id && /^\d+$/.test(id) ? { proof_request_id: Number(id) } : {}) });
        };
        const finished = (e: { requestId: string; timestamp: number; encodedDataLength: number }) => { const r = network.get(e.requestId); if (r) Object.assign(r, { finish_ms: 1000 * (e.timestamp - start), encoded_bytes: e.encodedDataLength }); };
        const rule = (e: { requestId: string; appliedNetworkConditionsId?: string }) => { if (e.appliedNetworkConditionsId) applied.set(e.requestId, e.appliedNetworkConditionsId); };
        cdp.on("Network.requestWillBeSent", sent).on("Network.responseReceived", responded).on("Network.loadingFinished", finished).on("Network.requestWillBeSentExtraInfo", rule);
        const begin = performance.now();
        try {
          const [response] = await Promise.all([waitForSampleCoreResponse(page, "/api/v1/crm/directory"), page.goto(origin + "/customers", { waitUntil: "domcontentloaded", timeout: 120000 })]);
          assert.equal(response.status(), 200);
          assert.equal(response.headers()["cache-control"], "private, no-store");
          const { observed_at, ...data } = await response.json(); void observed_at;
          assert.equal(createHash("sha256").update(JSON.stringify(data)).digest("hex"), expected.expected_sha256);
          await settled(page);
          const readyMs = performance.now() - begin;
          assert.deepEqual(await page.locator(viewport.name === "phone" ? ".crm-directory-mobile-main strong" : ".crm-directory-table tbody th a").allTextContents(), data.items.map((r: { display_name: string }) => r.display_name));
          const core = [...network].filter(([, r]) => r.path === "/api/v1/crm/directory" && r.method === "GET");
          assert.equal(core.length, 1);
          assert.equal(applied.get(core[0][0]), rules[user]);
          samples.push({ viewport: viewport.name, wave, user, ready_ms: readyMs, free_memory_bytes: freemem(), network: [...network.values()] });
        } catch (error) {
          samples.push({ viewport: viewport.name, wave, user, error: error instanceof Error ? error.message : String(error), network: [...network.values()] });
          throw error;
        } finally {
          cdp.off("Network.requestWillBeSent", sent).off("Network.responseReceived", responded).off("Network.loadingFinished", finished).off("Network.requestWillBeSentExtraInfo", rule);
        }
      }));
      for (const o of outcomes) if (o.status === "rejected") errors.push(String(o.reason));
      await checkpoint(false);
      assert.equal(errors.length, 0, "Retain original failures; do not continue with a substituted sample");
      console.log(JSON.stringify({ label, viewport: viewport.name, wave, samples: samples.length }));
    }
    await pages[0].screenshot({ path: `${root}/${viewport.name}-directory.png`, timeout: 10000 });
    const outcomes = await Promise.allSettled(pages.map(async (page, user) => {
      const link = page.locator(viewport.name === "phone" ? ".crm-directory-mobile-main" : ".crm-directory-table tbody th a").first();
      const href = await link.getAttribute("href"); assert.ok(href);
      const target = new URL(href, origin), start = performance.now();
      const [response] = await Promise.all([waitForSampleCoreResponse(page, `/api/v1${target.pathname}/workspace`), viewport.name === "phone" ? link.tap() : link.click()]);
      assert.equal(response.status(), 200);
      const data = await response.json();
      assert.equal(data.context.id, target.pathname.split("/").at(-1));
      await expect(page).toHaveURL(target.href);
      await expect(page.getByRole("heading", { name: data.context.display_name, exact: true }).first()).toBeVisible();
      await settled(page);
      visits.push({ viewport: viewport.name, user, path: target.pathname, ready_ms: performance.now() - start, status: response.status() });
    }));
    for (const o of outcomes) if (o.status === "rejected") errors.push(String(o.reason));
    await checkpoint(false);
    assert.equal(errors.length, 0);
    await pages[0].screenshot({ path: `${root}/${viewport.name}-record.png`, timeout: 10000 });
    await Promise.all(contexts.map(c => c.close()));
  }
  assert.equal(samples.length, 80); assert.equal(visits.length, 20);
  const after = await performanceFixtureFingerprint(); assert.deepEqual(after, fixture);
  await writeFile(`${root}/fixture-after.json`, JSON.stringify(after, null, 2));
  await checkpoint(true);
} catch (error) {
  errors.push(String(error));
  await checkpoint(false);
  throw error;
} finally {
  await Promise.all(browsers.map(b => b.close()));
  if (process.env.PPO_PROOF_DIAGNOSTICS === "1") await writeFile(`${root}/gateway.jsonl`, await readFile(`verification-evidence/transport-diagnostics/process-${server.pid}.jsonl`)).catch(() => console.error("Gateway file unavailable; preserve original failure."));
  server.kill();
  await closeDatabase();
}
