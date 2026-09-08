import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { cpus, totalmem, freemem, loadavg, platform, release, arch } from "node:os";
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { chromium, expect, type BrowserContext, type CDPSession, type Page } from "@playwright/test";
import { closeDatabase, database } from "../src/platform/database";
import { qualityLoadFixture } from "./quality-load-fixture";

// Each virtual user normally owns a browser process/network service. Keep the
// original shared-process profile explicitly available for comparison.
const browserProcessCount = process.env.PPO_LOAD_BROWSER_PROCESSES ?? "10";
assert.ok(["1", "10"].includes(browserProcessCount), "PPO_LOAD_BROWSER_PROCESSES must be 1 or 10");
const root = "verification-evidence/p11-performance";
await mkdir(root, { recursive: true });
const origin = "http://127.0.0.1:3000";
async function resourceSnapshot() {
  const processes: Record<string, { count: number; resident_kib: number }> = {};
  for (const pid of (await readdir("/proc")).filter((x) => /^\d+$/.test(x))) {
    try {
      const name = (await readFile(`/proc/${pid}/comm`, "utf8")).trim();
      if (!/^(node|MainThread|next-server|chrome|chromium|headless_shell|postgres)/.test(name)) continue;
      const status = await readFile(`/proc/${pid}/status`, "utf8");
      const group = /^(node|MainThread|next-server)/.test(name) ? "node" : name.startsWith("postgres") ? "postgres" : "chromium";
      const item = processes[group] ??= { count: 0, resident_kib: 0 };
      item.count++;
      item.resident_kib += Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1] ?? 0);
    } catch { /* A process may exit between these read-only observations. */ }
  }
  const cgroup: Record<string, string | null> = {};
  for (const name of ["memory.current", "memory.peak", "memory.max", "memory.events"])
    cgroup[name] = await readFile(`/sys/fs/cgroup/${name}`, "utf8").then((x) => x.trim()).catch(() => null);
  return { free_memory_bytes: freemem(), load_average: loadavg(), processes, cgroup };
}
const resourceObservations: unknown[] = [];
const provenance = {
  source_head:
    process.env.PPO_SOURCE_HEAD ??
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
    encoding: "utf8",
  }).trim(),
  run_id: process.env.GITHUB_RUN_ID ?? null,
  run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
};
await writeFile(`${root}/provenance.json`, JSON.stringify(provenance, null, 2));
let fixture: Awaited<ReturnType<typeof qualityLoadFixture>>;
try {
  fixture = await qualityLoadFixture();
} catch (error) {
  const rolledBack = (
    await database().query(
      "SELECT count(*)::int AS remaining_fixture_records FROM ppo.business_identities WHERE id::text LIKE ANY(ARRAY['e1110000-%','e1120000-%','e1130000-%','e1150000-%','e1160000-%'])",
    )
  ).rows[0];
  await writeFile(
    `${root}/fixture-failure.json`,
    JSON.stringify(
      {
        ...provenance,
        stage: "fixture transaction",
        code: (error as { code?: string }).code ?? null,
        failure:
          "Declared load fixture did not commit; no timings were collected. Inspect the original CI job error.",
        ...rolledBack,
      },
      null,
      2,
    ),
  );
  await closeDatabase();
  throw error;
}
await writeFile(
  `${root}/fixture.json`,
  JSON.stringify({ ...provenance, fixture }, null, 2),
);
const server = spawn(
  process.execPath,
  ["--env-file=.env.local", "--import", "tsx", "scripts/local-server.ts"],
  { stdio: ["ignore", "inherit", "inherit"] },
);
const samples: {
  viewport: string;
  view: string;
  phase: string;
  wave: number;
  virtual_user: number;
  elapsed_ms: number;
  http_status: number;
  visible_rows: number | null;
  core_requests_with_network_rule: number;
  error: string | null;
}[] = [];
const browsers: Awaited<ReturnType<typeof chromium.launch>>[] = [];
try {
  let ready = false;
  for (let n = 0; n < 120; n++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "The exact guarded development server must start");
  // Retain each handle immediately so a later launch failure still closes
  // the processes already started. Launching remains outside measured waves.
  for (let n = 0; n < Number(browserProcessCount); n++)
    browsers.push(await chromium.launch({ channel: "chromium" }));
  const views = [
    {
      name: "Customers",
      route: "/customers",
      api: "/api/v1/customers",
      profile: "coordinator",
    },
    {
      name: "Work order",
      route: `/service/work-orders/${fixture.selected_work_order}`,
      api: `/api/v1/service/work-orders/${fixture.selected_work_order}`,
      profile: "coordinator",
    },
    {
      name: "Planner",
      route: "/schedule",
      api: "/api/v1/schedule",
      // Same initial seven-day Brisbane period as the planner UI. An omitted
      // range only tests validation (422), not the permitted planner read.
      controlApi: "/api/v1/schedule?" + new URLSearchParams({
        from: "2026-09-20T14:00:00.000Z",
        to: "2026-09-27T14:00:00.000Z",
        timezone: "Australia/Brisbane",
      }).toString(),
      profile: "coordinator",
    },
    {
      name: "My Jobs",
      route: "/my-jobs",
      api: "/api/v1/my-jobs",
      profile: "assigned-technician",
    },
  ];
  const contexts: BrowserContext[] = [];
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "phone", width: 390, height: 844 },
  ]) {
    for (const view of views) {
      for (let user = 0; user < 10; user++) {
        const context = await browsers[user % browsers.length].newContext({
          viewport: { width: viewport.width, height: viewport.height },
          locale: "en-AU",
          isMobile: viewport.name === "phone",
          hasTouch: viewport.name === "phone",
        });
        const login = await context.request.post(
          `${origin}/api/v1/local-session`,
          { headers: { Origin: origin }, data: { profile: view.profile } },
        );
        assert.ok(login.ok());
        contexts.push(context);
      }
      const pages = await Promise.all(contexts.map((c) => c.newPage()));
      const networkSessions = new Map<Page, { cdp: CDPSession; ruleId: string }>();
      for (const page of pages) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Network.enable");
        const conditions = {
          offline: false,
          latency: 40,
          downloadThroughput: 1250000,
          uploadThroughput: 625000,
          connectionType: "wifi" as const,
        };
        // Chrome's documented replacement preserves both actual network
        // throttling and navigator state. An empty pattern applies globally;
        // no route, asset or core API is exempted from the original limits.
        const { ruleIds } = await cdp.send("Network.emulateNetworkConditionsByRule", {
          offline: false,
          matchedNetworkConditions: [{ urlPattern: "", ...conditions }],
        });
        assert.equal(ruleIds.length, 1);
        await cdp.send("Network.overrideNetworkState", conditions);
        networkSessions.set(page, { cdp, ruleId: ruleIds[0] });
      }
      for (let wave = 0; wave < 4; wave++) {
        resourceObservations.push({ viewport: viewport.name, view: view.name, wave, boundary: "before", observed_at: new Date().toISOString(), ...await resourceSnapshot() });
        await Promise.all(
          pages.map(async (page, virtual_user) => {
            const at = performance.now();
            const coreEvents: { event: string; elapsed_ms: number; status?: number; error?: string }[] = [];
            const documentEvents: { event: string; elapsed_ms: number; status?: number }[] = [];
            const assets = { requested: 0, completed: 0, failed: 0 };
            const assetEvents = new Map<import("@playwright/test").Request, {
              path: string; type: string; requested_ms: number;
              response_ms?: number; status?: number; completed_ms?: number; failed_ms?: number;
            }>();
            const { cdp, ruleId } = networkSessions.get(page)!;
            const coreRequestIds = new Set<string>();
            const appliedRules = new Map<string, string>();
            const coreProtocolRequest = (event: { requestId: string; request: { url: string; method: string } }) => {
              if (new URL(event.request.url).pathname === view.api && event.request.method === "GET") coreRequestIds.add(event.requestId);
            };
            const appliedRule = (event: { requestId: string; appliedNetworkConditionsId?: string }) => {
              // Inspect only this explicit protocol field. Never retain the
              // accompanying cookie/header data from ExtraInfo events.
              if (event.appliedNetworkConditionsId && appliedRules.size < 100)
                appliedRules.set(event.requestId, event.appliedNetworkConditionsId);
            };
            const coreRuleMatches = () => [...coreRequestIds].filter((id) => appliedRules.get(id) === ruleId).length;
            cdp.on("Network.requestWillBeSent", coreProtocolRequest).on("Network.requestWillBeSentExtraInfo", appliedRule);
            const documentEvent = (event: string, status?: number) => {
              if (documentEvents.length < 20) documentEvents.push({ event, elapsed_ms: performance.now() - at, ...(status === undefined ? {} : { status }) });
            };
            const crashed = () => documentEvent("page-crashed");
            const domLoaded = () => documentEvent("domcontentloaded");
            const loaded = () => documentEvent("load");
            const relevant = (request: import("@playwright/test").Request) =>
              new URL(request.url()).pathname === view.api && request.method() === "GET";
            const requested = (request: import("@playwright/test").Request) => {
              if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentEvent("document-request");
              if (["script", "font", "stylesheet"].includes(request.resourceType())) assets.requested++;
              if (["script", "font", "stylesheet"].includes(request.resourceType()) && assetEvents.size < 40 && new URL(request.url()).origin === origin)
                assetEvents.set(request, { path: new URL(request.url()).pathname, type: request.resourceType(), requested_ms: performance.now() - at });
              if (relevant(request) && coreEvents.length < 20)
                coreEvents.push({ event: "request", elapsed_ms: performance.now() - at });
            };
            const responded = (response: import("@playwright/test").Response) => {
              if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) documentEvent("document-response", response.status());
              const asset = assetEvents.get(response.request());
              if (asset) Object.assign(asset, { response_ms: performance.now() - at, status: response.status() });
              if (relevant(response.request()) && coreEvents.length < 20)
                coreEvents.push({ event: "response", elapsed_ms: performance.now() - at, status: response.status() });
            };
            const failed = (request: import("@playwright/test").Request) => {
              if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentEvent("document-request-failed");
              if (["script", "font", "stylesheet"].includes(request.resourceType())) assets.failed++;
              const asset = assetEvents.get(request);
              if (asset) asset.failed_ms = performance.now() - at;
              if (relevant(request) && coreEvents.length < 20)
                coreEvents.push({ event: "request-failed", elapsed_ms: performance.now() - at, error: request.failure()?.errorText ?? "Unknown transport failure" });
            };
            const completed = (request: import("@playwright/test").Request) => {
              if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentEvent("document-finished");
              if (["script", "font", "stylesheet"].includes(request.resourceType())) assets.completed++;
              const asset = assetEvents.get(request);
              if (asset) asset.completed_ms = performance.now() - at;
            };
            page.on("request", requested).on("response", responded).on("requestfailed", failed).on("requestfinished", completed).on("crash", crashed).on("domcontentloaded", domLoaded).on("load", loaded);
            let status = 0,
              rows: number | null = null,
              error: string | null = null,
              finished = at;
            try {
              // Attach rejection handlers to both operations immediately. A
              // navigation failure must remain an original failed sample, not
              // leave a response waiter that terminates the measurement early.
              const [received] = await Promise.all([
                page.waitForResponse(
                  (r) =>
                    new URL(r.url()).pathname === view.api &&
                    r.request().method() === "GET",
                  { timeout: 120000 },
                ),
                page.goto(origin + view.route, {
                  waitUntil: "domcontentloaded",
                  timeout: 120000,
                }),
              ]);
              status = received.status();
              const body = await received.json();
              rows = Array.isArray(body.items) ? body.items.length : null;
              assert.ok(received.ok(), body.message ?? `HTTP ${status}`);
              assert.equal(
                received.headers()["cache-control"],
                "private, no-store",
              );
              await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false", {
                timeout: 120000,
              });
              await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled({ timeout: 120000 });
              await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0, {
                timeout: 120000,
              });
              await expect(
                page.locator('.business-error[role="alert"]'),
              ).toHaveCount(0);
              await page.evaluate(
                () =>
                  new Promise<void>((r) =>
                    requestAnimationFrame(() =>
                      requestAnimationFrame(() => r()),
                    ),
                  ),
              );
              assert.ok(coreRequestIds.size > 0, "The actual core GET must be observed by Chromium");
              assert.equal(coreRuleMatches(), coreRequestIds.size, "Every observed core GET must have the declared network rule applied");
              finished = performance.now();
            } catch (e) {
              finished = performance.now();
              error = e instanceof Error ? e.message : "Read failed";
              {
                // Freeze observations at the failed sample boundary. Neither
                // screenshot collection nor a later wave may change them.
                const failureObservation = structuredClone({
                  observed_at: new Date().toISOString(),
                  elapsed_ms: finished - at,
                  core_events: coreEvents,
                  document_events: documentEvents,
                  assets,
                  asset_events: [...assetEvents.values()],
                  network_rule: { rule_id: ruleId, core_requests: coreRequestIds.size, matched_core_requests: coreRuleMatches() },
                });
                const name = `${viewport.name}-${view.name.replaceAll(" ", "-")}-wave-${wave}-user-${virtual_user}-failure`;
                let captureError: string | null = null;
                const bytes = await page
                  .screenshot({
                    path: `${root}/${name}.png`,
                    fullPage: true,
                    timeout: 10000,
                  })
                  .catch((captureFailure: unknown) => {
                    captureError = captureFailure instanceof Error ? captureFailure.message : "Capture failed";
                    return null;
                  });
                // Independent control reads occur only AFTER the failed sample
                // is frozen. They do not traverse the page renderer or its CDP
                // throttling, and cannot turn the failed measurement into a pass.
                const assetPath = [...assetEvents.values()].find((asset) =>
                  asset.type === "script" && asset.path.startsWith("/_next/static/"))?.path;
                const probes = [
                  { kind: "core-api", path: view.controlApi ?? view.api },
                  { kind: "document", path: view.route },
                  ...(assetPath ? [{ kind: "requested-script", path: assetPath }] : []),
                ];
                const controlReads = await Promise.all(probes.map(async (probe) => {
                  const began = performance.now();
                  try {
                    const response = await page.context().request.get(origin + probe.path, {
                      timeout: 5000, maxRetries: 0, maxRedirects: 0,
                    });
                    try {
                      const body = await response.body();
                      return { kind: probe.kind, elapsed_ms: performance.now() - began,
                        status: response.status(), byte_count: body.length,
                        sha256: createHash("sha256").update(body).digest("hex") };
                    } finally { await response.dispose(); }
                  } catch {
                    return { kind: probe.kind, elapsed_ms: performance.now() - began,
                      unavailable: true };
                  }
                }));
                await writeFile(
                  `${root}/${name}-proof.json`,
                  JSON.stringify(
                    {
                      ...provenance,
                      viewport,
                      scenario: name,
                      error,
                      ...failureObservation,
                      page_closed: page.isClosed(),
                      page_path: new URL(page.url()).pathname,
                      capture_error: captureError,
                      post_failure_control_reads: controlReads,
                      control_read_limit: "At most three concurrent 5-second GETs using the same server-issued browser-context session through APIRequestContext, outside renderer/CDP throttling and after the failed timing boundary. No retry, redirect, body, URL query, cookie or header is retained. These observations never replace the failed sample and may warm server caches before later waves.",
                      resources: await resourceSnapshot(),
                      diagnostic_limit: "Frozen failed-sample observation: at most 20 core GET and 20 main-document events, 40 same-origin asset paths/timings/statuses, aggregate counts and applied network-rule IDs. Process resident memory/cgroup counters and bounded screenshot follow outside the sample. No process arguments, bodies, headers, query strings, cookies or session trace. No unbounded DOM query is attempted against an unresponsive renderer.",
                      byte_count: bytes?.length ?? null,
                      sha256: bytes
                        ? createHash("sha256").update(bytes).digest("hex")
                        : null,
                    },
                    null,
                    2,
                  ),
                );
              }
            } finally {
              page.off("request", requested).off("response", responded).off("requestfailed", failed).off("requestfinished", completed).off("crash", crashed).off("domcontentloaded", domLoaded).off("load", loaded);
              cdp.off("Network.requestWillBeSent", coreProtocolRequest).off("Network.requestWillBeSentExtraInfo", appliedRule);
            }
            samples.push({
              viewport: viewport.name,
              view: view.name,
              phase:
                wave === 0
                  ? "cold browser context / first view wave"
                  : "warm repeat navigation",
              wave,
              virtual_user,
              elapsed_ms: finished - at,
              http_status: status,
              visible_rows: rows,
              core_requests_with_network_rule: coreRuleMatches(),
              error,
            });
          }),
        );
        resourceObservations.push({ viewport: viewport.name, view: view.name, wave, boundary: "after", observed_at: new Date().toISOString(), ...await resourceSnapshot() });
        await writeFile(`${root}/resource-observations.json`, JSON.stringify({ ...provenance, observations: resourceObservations, limits: "Aggregate RSS includes shared pages per process and is not unique memory. Read-only /proc names/status and cgroup memory counters; no process arguments, environment or credentials." }, null, 2));
        await writeFile(
          `${root}/raw-samples.json`,
          JSON.stringify({ ...provenance, fixture, samples }, null, 2),
        );
      }
      const bytes = await pages[0].screenshot({
        path: `${root}/${viewport.name}-${view.name.replaceAll(" ", "-")}.png`,
        fullPage: true,
      });
      await writeFile(
        `${root}/${viewport.name}-${view.name.replaceAll(" ", "-")}-proof.json`,
        JSON.stringify(
          {
            ...provenance,
            scenario: `PT-27 loaded ${view.name} after ten concurrent users`,
            viewport,
            full_page: true,
            byte_count: bytes.length,
            sha256: createHash("sha256").update(bytes).digest("hex"),
          },
          null,
          2,
        ),
      );
      await Promise.all(contexts.map((c) => c.close()));
      contexts.length = 0;
    }
  }
  const groups = [
    ...new Set(samples.map((s) => `${s.viewport}|${s.view}|${s.phase}`)),
  ].map((key) => {
    const rows = samples.filter(
      (s) => `${s.viewport}|${s.view}|${s.phase}` === key,
    );
    const sorted = rows.map((s) => s.elapsed_ms).sort((a, b) => a - b);
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
    return {
      group: key,
      count: rows.length,
      failures: rows.filter((s) => s.error).length,
      p95_ms: p95,
      target_ms: 3000,
      meets_candidate: rows.every((s) => !s.error) && p95 <= 3000,
    };
  });
  await writeFile(
    `${root}/PT-27-proof.json`,
    JSON.stringify(
      {
        ...provenance,
        fixture,
        profile: {
          node: process.version,
          browser: browsers[0].version(),
          browser_processes: browsers.length,
          development_compiler: process.env.PPO_DEV_COMPILER ?? "turbopack",
          browser_execution: "Pinned Playwright bundled full Chromium, channel chromium, unified headless mode. Earlier unset-channel headless-shell samples are a separate profile, not pooled with this series.",
          platform: platform(),
          os_release: release(),
          arch: arch(),
          cpu: cpus().map((c) => c.model),
          memory_bytes: totalmem(),
          network: {
            method: "Chromium DevTools Network.emulateNetworkConditionsByRule global empty-pattern rule plus Network.overrideNetworkState; each successful core GET verifies appliedNetworkConditionsId",
            latency_ms: 40,
            download_bytes_per_second: 1250000,
            upload_bytes_per_second: 625000,
            server_database:
              "same disposable CI runner; loopback PostgreSQL 16.15",
          },
          build:
            "Pinned Next.js guarded development server after successful production compilation check. Development compiler filesystem cache remains disabled. Production hosting/start remains prohibited.",
          concurrency:
            `${browsers.length} Chromium browser process(es); ten fresh contexts and server-issued sessions per view wave, ${browsers.length === 10 ? "one process and network service per virtual user" : "original shared-process comparison"}. Role-appropriate existing synthetic Coordinator or assigned Technician identity. These are 10 virtual users, not 10 distinct staff identities.`,
          cold_warm:
            "Each view begins with 10 fresh contexts, empty browser caches and no preceding measured navigation in those contexts. Only the first desktop visit can include first route compilation in this shared fresh server; later views/phone can reuse server modules and database/OS caches. Warm is three subsequent navigation waves in the same contexts. No OS cache flush or durable offline-storage inference.",
          boundary:
            "Browser navigation initiation to successful core API response, settled identity region and enabled Change identity control, completed loading, no business error and two animation frames. Authentication setup is outside the timed boundary; navigation, HTML, assets, API and rendering are inside.",
          limits:
            "Headless Chromium on CI hardware with emulated viewport/network; not a real phone, screen-reader session, PDF accessibility or whole-product conformance proof. Candidate timing failures are recorded, not silently excluded. No exports or offline synchronisation in this core-read sample.",
        },
        groups,
        samples,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ benchmark: "PT-27", groups, candidate_only: true }),
  );
  assert.ok(
    samples.every((s) => !s.error),
    "Core read errors must be investigated; raw timings and failures retained",
  );
} finally {
  await Promise.all(browsers.map((browser) => browser.close()));
  if (server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    await stopped;
  }
  await closeDatabase();
}
