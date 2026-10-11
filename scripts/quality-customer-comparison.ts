import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { freemem, totalmem } from "node:os";
import { runInNewContext } from "node:vm";
import { chromium, expect, type Page } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import { performanceFixtureFingerprint } from "./quality-performance-fixture";
import { waitForSampleCoreResponse } from "./quality-core-response";
import { comparisonProfile, cpuAllocation } from "./quality-comparison-profile";
import { assetDiagnosticsAllowed, assetReleaseProbeAllowed, assetSampleHeader, observeAssetNetwork } from "./quality-asset-observer";
import { assertCalibration, installNetworkConditions, networkMethod } from "./quality-network-conditioning";

// Bounded Customers diagnostic, separate from the complete four-view PT-27 run.
// Ten browser processes and unchanged network/readiness limits. Original results
// are written after every wave; a failed run is never silently retried.
const label = process.argv[2];
assert.match(label ?? "", /^[a-z][a-z0-9-]+$/);
const profile = comparisonProfile(process.env);
const allocation = cpuAllocation(process.env);
const method = networkMethod(process.env);
const assetDiagnostics = assetDiagnosticsAllowed(process.env, true);
if (process.env.PPO_ASSET_DIAGNOSTICS) assert.ok(assetDiagnostics, "Asset observation requires the explicit compiled synthetic profile");
const releaseProbe = assetReleaseProbeAllowed(process.env);
if (process.env.PPO_ASSET_RELEASE_PROBE) assert.ok(releaseProbe, "Release probe requires its own post-failure diagnostic profile");
if (allocation) assert.equal(process.platform, "linux");
if (process.env.PPO_BROWSER_WRAPPER) assert.ok(allocation, "Browser constraint requires the explicit CPU diagnostic");
const root = `verification-evidence/pt27-loading/${label}`;
await mkdir(root, { recursive: false });
const expected = JSON.parse(await readFile("verification-evidence/customer-loading-diagnosis/fixture.json", "utf8"));
const compiledSource = process.env.PPO_COMPILED_SOURCE;
assert.match(compiledSource ?? "", /^[0-9a-f]{40}$/);
const calibratedBlock = process.env.PPO_COMPARISON_BLOCK?.startsWith("cpu-assets-network-");
const calibration = calibratedBlock ? JSON.parse(await readFile("verification-evidence/pt27-network-calibration/protocol.json", "utf8")) : null;
if (calibratedBlock) assertCalibration(calibration, compiledSource!);
execFileSync("git", ["diff", "--exit-code", compiledSource!, "--", "src", "db", "public", "package.json", "package-lock.json", "scripts/build-offline.ts", "next.config.ts"]);
const fixture = await performanceFixtureFingerprint();
assert.deepEqual(fixture, expected.fixture);
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
const origin = localConfig().origin;
const serverArgs = ["--env-file=.env.local", "--import", "tsx", "scripts/local-server.ts", "--compiled"];
const server = allocation
  ? spawn("taskset", ["--cpu-list", allocation.server.join(","), process.execPath, ...serverArgs], { stdio: "inherit" })
  : spawn(process.execPath, serverArgs, { stdio: "inherit" });
const browsers: Awaited<ReturnType<typeof chromium.launch>>[] = [];
const samples: Record<string, unknown>[] = [];
const visits: Record<string, unknown>[] = [];
const errors: string[] = [];
const releaseProbes: Record<string, unknown>[] = [];
const metadata = {
  ...profile,
  ...(allocation ? { cpu_allocation: allocation } : {}),
  ...(process.env.PPO_BROWSER_WRAPPER ? { browser_cpu_constraint: "cgroup-v2-cpuset" } : {}),
  label, started_at: new Date().toISOString(), comparison_block: process.env.PPO_COMPARISON_BLOCK ?? null, comparison_position: process.env.PPO_COMPARISON_POSITION ?? null, source: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  compiled_source: compiledSource, driver_source: process.env.PPO_DRIVER_SOURCE ?? null, build_id: buildId, server_pid: server.pid,
  node: process.version, platform: process.platform, memory_bytes: totalmem(),
  detailed_diagnostics: process.env.PPO_PROOF_DIAGNOSTICS === "1",
  asset_diagnostics: assetDiagnostics,
  asset_release_probe: releaseProbe,
  network: { latency_ms: 40, download_bytes_per_second: 1250000, upload_bytes_per_second: 625000 },
  network_method: method,
  ...(calibration ? { network_calibration: { source: calibration.source, browser: calibration.browser, passed: calibration.passed } } : {}),
  fixture, target_ms: 3000,
  limits: `Customers only; ${profile.browser_count} independent headless Chrome process(es), four waves per viewport and one actual record activation per user/viewport. A one-browser run is a startup diagnostic and cannot satisfy the ten-user target. Fresh browser contexts for the cold wave, three warm repeats, retained database/OS caches. Results apply to the recorded run host; no physical-device, hosted, screen-reader or whole PT-27 acceptance. CDP path/status/transfer observations and optional gateway logging add overhead. Fonts/Kit use this build's normal configuration; no network request is exempted.`,
};
async function checkpoint(complete: boolean) {
  await writeFile(`${root}/results.json`, JSON.stringify({ ...metadata, complete, browser: browsers[0]?.version(), samples, record_visits: visits, errors }, null, 2));
  if (releaseProbe) await writeFile(`${root}/asset-release.json`, JSON.stringify(releaseProbes, null, 2));
}
async function settled(page: Page) {
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false", { timeout: 120000 });
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
  await expect(page.getByText(/^Loading .*\u2026$/)).toHaveCount(0, { timeout: 120000 });
  await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}
try {
  for (const [route, name] of [["customers", "customer-client"], ["customers/[id]", "customer-record"]]) {
    const manifestText = await readFile(`.next/server/app/(business)/${route}/page_client-reference-manifest.js`, "utf8");
    const scope = { globalThis: {} as { __RSC_MANIFEST?: Record<string, unknown> } };
    runInNewContext(manifestText, scope);
    await writeFile(`${root}/${name}-manifest.json`, JSON.stringify(scope.globalThis.__RSC_MANIFEST, null, 2));
  }
  // Immutable process metadata lets an external sampler observe both logging
  // modes without enabling the application's detailed diagnostic writer.
  await writeFile(`${root}/run.json`, JSON.stringify(metadata, null, 2));
  let ready = false;
  const startupDeadline = performance.now() + 120000;
  while (performance.now() < startupDeadline) {
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  assert.ok(ready, "Owned compiled server must start within 120 seconds");
  browsers.push(...await Promise.all(Array.from({ length: profile.browser_count }, () => chromium.launch({ channel: "chrome", ...(process.env.PPO_BROWSER_WRAPPER ? { executablePath: process.env.PPO_BROWSER_WRAPPER } : {}) }))));
  if (calibration) for (const browser of browsers) assertCalibration(calibration, compiledSource!, browser.version());
  for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "phone", width: 390, height: 844 }]) {
    const contexts = await Promise.all(browsers.map(b => b.newContext({ viewport, isMobile: viewport.name === "phone", hasTouch: viewport.name === "phone", locale: "en-AU" })));
    for (const context of contexts) assert.equal((await context.request.post(`${origin}/api/v1/local-session`, { headers: { Origin: origin }, data: { profile: "coordinator" } })).status(), 200);
    const pages = await Promise.all(contexts.map(c => c.newPage()));
    const sessions = await Promise.all(pages.map(p => p.context().newCDPSession(p)));
    const rules: (string | null)[] = [];
    for (const cdp of sessions) {
      await cdp.send("Network.enable");
      await cdp.send("Performance.enable");
      rules.push(await installNetworkConditions(cdp, method));
    }
    for (let wave = 0; wave < 4; wave++) {
      const outcomes = await Promise.allSettled(pages.map(async (page, user) => {
        const cdp = sessions[user], network = new Map<string, Record<string, unknown>>(), applied = new Map<string, string>();
        const assetSample = `${viewport.name}-${wave}-${user}`;
        if (assetDiagnostics) await page.setExtraHTTPHeaders({ [assetSampleHeader]: assetSample });
        const beforeMetrics = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.filter(m => ["TaskDuration", "ScriptDuration", "LayoutDuration", "RecalcStyleDuration", "JSHeapUsedSize"].includes(m.name)).map(m => [m.name, m.value]));
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
        const stopAssetObserver = assetDiagnostics ? observeAssetNetwork(cdp, network, () => start) : () => {};
        const beganAt = Date.now(), begin = performance.now();
        let coreHeadersMs: number | null = null;
        try {
          const [response] = await Promise.all([waitForSampleCoreResponse(page, "/api/v1/crm/directory").then(response => { coreHeadersMs = performance.now() - begin; return response; }), page.goto(origin + "/customers", { waitUntil: "domcontentloaded", timeout: 120000 })]);
          assert.equal(response.status(), 200);
          assert.equal(response.headers()["cache-control"], "private, no-store");
          const { observed_at, ...data } = await response.json(); void observed_at;
          const coreJsonMs = performance.now() - begin;
          assert.equal(createHash("sha256").update(JSON.stringify(data)).digest("hex"), expected.expected_sha256);
          await settled(page);
          const readyMs = performance.now() - begin;
          assert.deepEqual(await page.locator(viewport.name === "phone" ? ".crm-directory-mobile-main strong" : ".crm-directory-table tbody th a").allTextContents(), data.items.map((r: { display_name: string }) => r.display_name));
          const core = [...network].filter(([, r]) => r.path === "/api/v1/crm/directory" && r.method === "GET");
          assert.equal(core.length, 1);
          if (method === "rule") assert.equal(applied.get(core[0][0]), rules[user]);
          else assert.equal(rules[user], null); // Global CDP has no request rule ID; independent calibration is mandatory.
          // Read diagnostics after the unchanged readiness boundary and assertions.
          const navigation = await page.evaluate(() => {
            const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
            return { response_start_ms: entry.responseStart, response_end_ms: entry.responseEnd, dom_interactive_ms: entry.domInteractive, dom_content_loaded_ms: entry.domContentLoadedEventEnd, load_event_ms: entry.loadEventEnd };
          });
          const metrics = await cdp.send("Performance.getMetrics");
          const browserMetrics = Object.fromEntries(metrics.metrics.filter(m => ["TaskDuration", "ScriptDuration", "LayoutDuration", "RecalcStyleDuration", "JSHeapUsedSize"].includes(m.name)).map(m => [m.name, m.value]));
          // Cross-navigation differences can be negative: these counters do not
          // establish one continuous measurement interval. Retain raw readings
          // without calling their difference per-action browser work.
          samples.push({ viewport: viewport.name, wave, user, ...(assetDiagnostics ? { asset_sample: assetSample } : {}), started_at_ms: beganAt, ready_ms: readyMs, core_headers_ms: coreHeadersMs, core_json_processed_ms: coreJsonMs, navigation, browser_metrics: browserMetrics, browser_metrics_before: beforeMetrics, free_memory_bytes: freemem(), network: [...network.values()] });
        } catch (error) {
          // Freeze the failed window before any diagnostic intervention. The
          // original error is still thrown; no subsequent measured wave runs.
          const originalFailure = { viewport: viewport.name, wave, user, ...(assetDiagnostics ? { asset_sample: assetSample, observed_until_ms: Date.now() } : {}), started_at_ms: beganAt, error: error instanceof Error ? error.message : String(error), network: structuredClone([...network.values()]) };
          samples.push(originalFailure);
          if (releaseProbe && error instanceof Error && error.name === "TimeoutError" &&
              ![...network.values()].some(row => row.path === "/api/v1/local-session" || row.path === "/api/v1/crm/directory") &&
              [...network.values()].some(row => row.type === "Script" && row.finish_ms === undefined)) {
            await writeFile(`${root}/asset-failure-${assetSample}.json`, JSON.stringify(originalFailure, null, 2), { flag: "wx" });
            const probe: Record<string, unknown> = { sample: assetSample, started_at_ms: Date.now(), original_failed: true, phases: [] };
            releaseProbes.push(probe);
            for (const intervention of ["unchanged", "remove-network-emulation"] as const) {
              const at = Date.now(), phase: Record<string, unknown> = { intervention, started_at_ms: at, observation_limit_ms: 10000 };
              (probe.phases as Record<string, unknown>[]).push(phase);
              // Observe only newly started directory reads in this phase. This
              // is a post-failure diagnostic, never a replacement load sample.
              const resumed = waitForSampleCoreResponse(page, "/api/v1/crm/directory", 10000)
                .then(response => ({ response }), () => ({ response: null }));
              try {
                if (intervention === "remove-network-emulation")
                  await cdp.send("Network.emulateNetworkConditionsByRule", { offline: false, matchedNetworkConditions: [] });
                const { response } = await resumed;
                phase.core_headers_at_ms = response ? Date.now() : null;
                phase.core_status = response?.status() ?? null;
                if (response) {
                  let deadline: ReturnType<typeof setTimeout> | undefined;
                  try {
                    const body = await Promise.race([response.json(), new Promise<never>((_, reject) => {
                      deadline = setTimeout(() => reject(Error("probe-body-unavailable")), Math.max(1, 10000 - (Date.now() - at)));
                    })]);
                    const { observed_at, ...data } = body; void observed_at;
                    phase.expected_payload = createHash("sha256").update(JSON.stringify(data)).digest("hex") === expected.expected_sha256;
                  } finally { clearTimeout(deadline); }
                }
                phase.network = structuredClone([...network.values()]);
                phase.finished_at_ms = Date.now();
                if (response) break;
              } catch { phase.probe_error = "observation-unavailable"; phase.finished_at_ms = Date.now(); break; }
            }
            await writeFile(`${root}/asset-release-${assetSample}.json`, JSON.stringify(probe, null, 2), { flag: "wx" });
          }
          throw error;
        } finally {
          stopAssetObserver();
          cdp.off("Network.requestWillBeSent", sent).off("Network.responseReceived", responded).off("Network.loadingFinished", finished).off("Network.requestWillBeSentExtraInfo", rule);
        }
      }));
      for (const o of outcomes) if (o.status === "rejected") errors.push(String(o.reason));
      await checkpoint(false);
      assert.equal(errors.length, 0, "Retain original failures; do not continue with a substituted sample");
      if (assetDiagnostics && wave === 0) {
        const events = (await readFile(`verification-evidence/asset-diagnostics/process-${server.pid}.jsonl`, "utf8")).trim().split("\n").map(line => JSON.parse(line));
        assert.ok(!events.some(e => e.event === "asset-cap-reached"));
        for (let user = 0; user < profile.browser_count; user++) {
          const observed = events.filter(e => e.sample === `${viewport.name}-${wave}-${user}` && e.path.endsWith(".js"));
          assert.ok(observed.some(e => e.event === "asset-received"), "Require actual tagged compiled asset receipt");
          assert.ok(observed.some(e => e.event === "asset-finished"), "Require actual tagged compiled asset finish");
        }
      }
      console.log(JSON.stringify({ label, viewport: viewport.name, wave, samples: samples.length }));
    }
    await pages[0].screenshot({ path: `${root}/${viewport.name}-directory.png`, timeout: 10000 });
    const outcomes = await Promise.allSettled(pages.map(async (page, user) => {
      const link = page.locator(viewport.name === "phone" ? ".crm-directory-mobile-main" : ".crm-directory-table tbody th a").first();
      const href = await link.getAttribute("href"); assert.ok(href);
      const target = new URL(href, origin), beganAt = Date.now(), start = performance.now();
      const [response] = await Promise.all([waitForSampleCoreResponse(page, `/api/v1${target.pathname}/workspace`), viewport.name === "phone" ? link.tap() : link.click()]);
      assert.equal(response.status(), 200);
      const data = await response.json();
      assert.equal(data.context.id, target.pathname.split("/").at(-1));
      await expect(page).toHaveURL(target.href);
      await expect(page.getByRole("heading", { name: data.context.display_name, exact: true }).first()).toBeVisible();
      await settled(page);
      visits.push({ viewport: viewport.name, user, started_at_ms: beganAt, path: target.pathname, ready_ms: performance.now() - start, status: response.status() });
    }));
    for (const o of outcomes) if (o.status === "rejected") errors.push(String(o.reason));
    await checkpoint(false);
    assert.equal(errors.length, 0);
    await pages[0].screenshot({ path: `${root}/${viewport.name}-record.png`, timeout: 10000 });
    await Promise.all(contexts.map(c => c.close()));
  }
  assert.equal(samples.length, profile.browser_count * 8); assert.equal(visits.length, profile.browser_count * 2);
  const after = await performanceFixtureFingerprint(); assert.deepEqual(after, fixture);
  await writeFile(`${root}/fixture-after.json`, JSON.stringify(after, null, 2));
  await checkpoint(true);
} catch (error) {
  errors.push(String(error));
  await checkpoint(false);
  throw error;
} finally {
  try { await Promise.all(browsers.map(b => b.close())); } finally {
  try {
    if (assetDiagnostics) {
      try { await writeFile(`${root}/assets.jsonl`, await readFile(`verification-evidence/asset-diagnostics/process-${server.pid}.jsonl`)); }
      catch { console.error("Asset observations unavailable; preserve original failure."); }
    }
    if (process.env.PPO_PROOF_DIAGNOSTICS === "1") {
      try {
        const gateway = await readFile(`verification-evidence/transport-diagnostics/process-${server.pid}.jsonl`);
        await writeFile(`${root}/gateway.jsonl`, gateway);
      } catch { console.error("Gateway file unavailable; preserve original failure."); }
    }
  } finally {
    server.kill();
    await closeDatabase();
  }
  }
}
