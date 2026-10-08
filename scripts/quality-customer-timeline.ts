import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { performanceFixtureFingerprint } from "./quality-performance-fixture";
import { closeDatabase } from "../src/platform/database";
import { qualityLoadFixture } from "./quality-load-fixture";
import { createSession } from "../src/platform/identity";
import { readDirectory } from "../src/crm/directory";
import { waitForSampleCoreResponse } from "./quality-core-response";
const mode = process.argv[2];
assert.ok(
  [
    "prepare",
    "measure",
    "candidate",
    "control",
    "candidate-repeat",
    "candidate-confirm",
  ].includes(mode),
);
const root = "verification-evidence/customer-loading-diagnosis";
await mkdir(root, { recursive: true });
if (mode === "prepare") {
  const preparation = await qualityLoadFixture();
  const fixture = await performanceFixtureFingerprint();
  const principal = (await createSession("coordinator")).principal;
  const { observed_at: ignored, ...expected } = await readDirectory(principal, {
    kind: "organisations",
  });
  void ignored;
  await writeFile(
    `${root}/fixture.json`,
    JSON.stringify(
      {
        preparation,
        fixture,
        expected_sha256: createHash("sha256")
          .update(JSON.stringify(expected))
          .digest("hex"),
        prepared_at: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  await closeDatabase();
  console.log(
    "Prepared a fresh synthetic fixture; earlier PQ fixtures and evidence remain separate.",
  );
  process.exit(0);
}
const baseline = JSON.parse(await readFile(`${root}/fixture.json`, "utf8"));
// This run diagnoses the retained build; it must not silently measure edited source.
const compiledSource = "24d19b1f158efeb8ad97d62b50e516cbdac4d80e";
assert.equal(
  (await readFile(".next/BUILD_ID", "utf8")).trim(),
  "bXz2zLSgUTZhicOrJw-F3",
);
execFileSync("git", [
  "diff",
  "--exit-code",
  compiledSource,
  "--",
  "src",
  "db",
  "public",
  "package.json",
  "package-lock.json",
  "scripts/build-offline.ts",
  "next.config.ts",
]);
assert.deepEqual(await performanceFixtureFingerprint(), baseline.fixture);
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const server = spawn(
  process.execPath,
  [
    "--env-file=.env.local",
    "--import",
    "tsx",
    "scripts/local-server.ts",
    "--compiled",
  ],
  { stdio: ["ignore", "inherit", "inherit"] },
);
type NetworkRow = {
  id: string;
  path: string;
  method: string;
  type: string;
  start_ms: number;
  response_ms?: number;
  finished_ms?: number;
  status?: number;
  encoded_bytes?: number;
  disk_cache?: boolean;
  service_worker?: boolean;
  timing?: unknown;
  error?: string;
};
const browsers: Awaited<ReturnType<typeof chromium.launch>>[] = [];
const samples: {
  viewport: string;
  wave: number;
  user: number;
  ready_ms: number;
  core_ms: number;
  core_response_ms: number;
  core_requests: number;
  timeline: unknown;
  network: NetworkRow[];
}[] = [];
try {
  let ready = false;
  for (let i = 0; i < 240; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Compiled server ready within unchanged 120s bound");
  browsers.push(
    ...(await Promise.all(
      Array.from({ length: 10 }, () => chromium.launch({ channel: "chrome" })),
    )),
  );
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "phone", width: 390, height: 844 },
  ]) {
    const contexts = await Promise.all(
      browsers.map((b) =>
        b.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.name === "phone",
          hasTouch: viewport.name === "phone",
        }),
      ),
    );
    for (const context of contexts)
      assert.ok(
        (
          await context.request.post(`${origin}/api/v1/local-session`, {
            headers: { Origin: origin },
            data: { profile: "coordinator" },
          })
        ).ok(),
      );
    const pages = await Promise.all(contexts.map((c) => c.newPage()));
    const sessions = new Map<
      import("@playwright/test").Page,
      import("@playwright/test").CDPSession
    >();
    for (const page of pages) {
      const cdp = await page.context().newCDPSession(page);
      sessions.set(page, cdp);
      await cdp.send("Network.enable");
      await page.addInitScript(() => {
        performance.setResourceTimingBufferSize(1000);
        const state = window as typeof window & {
          __ppoLongTasks: { start_ms: number; duration_ms: number }[];
        };
        state.__ppoLongTasks = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            state.__ppoLongTasks.push({
              start_ms: entry.startTime,
              duration_ms: entry.duration,
            });
        }).observe({ type: "longtask", buffered: true });
      });
      const conditions = {
        offline: false,
        latency: 40,
        downloadThroughput: 1250000,
        uploadThroughput: 625000,
        connectionType: "wifi" as const,
      };
      await cdp.send("Network.emulateNetworkConditionsByRule", {
        offline: false,
        matchedNetworkConditions: [{ urlPattern: "", ...conditions }],
      });
      await cdp.send("Network.overrideNetworkState", conditions);
    }
    for (let wave = 0; wave < 4; wave++) {
      await Promise.all(
        pages.map(async (page, user) => {
          let requested = 0,
            requestAt = 0;
          const network = new Map<string, NetworkRow>();
          const cdp = sessions.get(page)!;
          let navigationStart = 0;
          const sent = (event: {
            requestId: string;
            timestamp: number;
            type?: string;
            request: { url: string; method: string };
          }) => {
            if (event.type === "Document" && !navigationStart)
              navigationStart = event.timestamp;
            if (!navigationStart) return;
            network.set(event.requestId, {
              id: event.requestId,
              path: new URL(event.request.url).pathname,
              method: event.request.method,
              type: event.type ?? "Unknown",
              start_ms: (event.timestamp - navigationStart) * 1000,
            });
          };
          const receivedEvent = (event: {
            requestId: string;
            timestamp: number;
            response: {
              status: number;
              fromDiskCache?: boolean;
              fromServiceWorker?: boolean;
              timing?: unknown;
            };
          }) => {
            const row = network.get(event.requestId);
            if (row)
              Object.assign(row, {
                response_ms: (event.timestamp - navigationStart) * 1000,
                status: event.response.status,
                disk_cache: event.response.fromDiskCache ?? false,
                service_worker: event.response.fromServiceWorker ?? false,
                timing: event.response.timing,
              });
          };
          const finishedEvent = (event: {
            requestId: string;
            timestamp: number;
            encodedDataLength: number;
          }) => {
            const row = network.get(event.requestId);
            if (row)
              Object.assign(row, {
                finished_ms: (event.timestamp - navigationStart) * 1000,
                encoded_bytes: event.encodedDataLength,
              });
          };
          const failedEvent = (event: {
            requestId: string;
            timestamp: number;
            errorText: string;
          }) => {
            const row = network.get(event.requestId);
            if (row)
              Object.assign(row, {
                finished_ms: (event.timestamp - navigationStart) * 1000,
                error: event.errorText,
              });
          };
          cdp.on("Network.requestWillBeSent", sent);
          cdp.on("Network.responseReceived", receivedEvent);
          cdp.on("Network.loadingFinished", finishedEvent);
          cdp.on("Network.loadingFailed", failedEvent);
          const begin = performance.now();
          const listener = (r: import("@playwright/test").Request) => {
            if (
              new URL(r.url()).pathname === "/api/v1/crm/directory" &&
              r.method() === "GET"
            ) {
              requested++;
              requestAt = performance.now();
            }
          };
          page.on("request", listener);
          try {
            const responsePromise = waitForSampleCoreResponse(
              page,
              "/api/v1/crm/directory",
            );
            // Attach rejection handling immediately while navigation is pending.
            void responsePromise.catch(() => undefined);
            await page.goto(origin + "/customers", {
              waitUntil: "domcontentloaded",
              timeout: 120000,
            });
            const response = await responsePromise;
            assert.ok(response.ok());
            const { observed_at: observedAt, ...result } =
              await response.json();
            void observedAt;
            const received = performance.now();
            await expect(
              page.getByRole("region", {
                name: "Local demonstration identity",
                exact: true,
              }),
            ).toHaveAttribute("aria-busy", "false", { timeout: 120000 });
            await expect(
              page.getByRole("button", {
                name: "Change identity",
                exact: true,
              }),
            ).toBeEnabled({ timeout: 120000 });
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
                    requestAnimationFrame(() => {
                      performance.mark("ppo:ready");
                      r();
                    }),
                  ),
                ),
            );
            const settledAt = performance.now();
            const timeline = await page.evaluate(() => ({
              clock:
                "Browser Performance Timeline milliseconds from this navigation; CDP rows are relative to its Document request, Node readiness is measured separately.",
              captured_ms: performance.now(),
              navigation: performance
                .getEntriesByType("navigation")
                .map((e) => e.toJSON()),
              resources: performance.getEntriesByType("resource").map((e) => {
                const resource = e.toJSON();
                resource.name = new URL(e.name).pathname;
                return resource;
              }),
              paint: performance
                .getEntriesByType("paint")
                .map((e) => e.toJSON()),
              ready_ms: performance.getEntriesByName("ppo:ready").at(-1)!
                .startTime,
              long_tasks: (
                window as typeof window & {
                  __ppoLongTasks: { start_ms: number; duration_ms: number }[];
                }
              ).__ppoLongTasks,
            }));
            cdp.off("Network.requestWillBeSent", sent);
            cdp.off("Network.responseReceived", receivedEvent);
            cdp.off("Network.loadingFinished", finishedEvent);
            cdp.off("Network.loadingFailed", failedEvent);
            assert.equal(
              createHash("sha256").update(JSON.stringify(result)).digest("hex"),
              baseline.expected_sha256,
              "Every browser response must match the retained authorised page",
            );
            const renderedNames = page.locator(
              viewport.name === "phone"
                ? ".crm-directory-mobile-main strong"
                : ".crm-directory-table tbody th a",
            );
            assert.deepEqual(
              await renderedNames.allTextContents(),
              result.items.map((r: { display_name: string }) => r.display_name),
            );
            assert.ok(await renderedNames.first().isVisible());
            samples.push({
              viewport: viewport.name,
              wave,
              user,
              ready_ms: settledAt - begin,
              core_ms: received - begin,
              core_response_ms: received - requestAt,
              core_requests: requested,
              timeline,
              network: [...network.values()],
            });
          } catch (error) {
            await writeFile(
              `${root}/${mode}-failure-${viewport.name}-${wave}-${user}.json`,
              JSON.stringify(
                {
                  viewport: viewport.name,
                  wave,
                  user,
                  core_requests: requested,
                  message:
                    error instanceof Error ? error.message : String(error),
                  network: [...network.values()],
                },
                null,
                2,
              ),
            );
            await page
              .screenshot({
                path: `${root}/${mode}-failure-${viewport.name}-${wave}-${user}.png`,
                timeout: 10000,
              })
              .catch(() => undefined);
            throw error;
          } finally {
            page.off("request", listener);
          }
        }),
      );
      await writeFile(
        `${root}/${mode}-completed-samples.json`,
        JSON.stringify({ complete: false, samples }, null, 2),
      );
      console.log(
        JSON.stringify({
          mode,
          viewport: viewport.name,
          wave,
          samples: samples.length,
        }),
      );
    }
    await pages[0].screenshot({
      path: `${root}/${mode}-${viewport.name}.png`,
      timeout: 30000,
    });
    await Promise.all(contexts.map((c) => c.close()));
  }
  const groups = ["desktop", "phone"].map((viewport) => {
    const selected = samples.filter((s) => s.viewport === viewport);
    const percentile = (key: "ready_ms" | "core_ms" | "core_response_ms") =>
      selected.map((s) => s[key]).sort((a, b) => a - b)[37];
    return {
      viewport,
      count: selected.length,
      p95_ready_ms: percentile("ready_ms"),
      p95_core_ms: percentile("core_ms"),
      p95_core_response_ms: percentile("core_response_ms"),
    };
  });
  assert.equal(samples.length, 80);
  assert.ok(
    samples.every((s) => s.core_requests === 1),
    "Exactly one Customers directory read per navigation",
  );
  const after = await performanceFixtureFingerprint();
  assert.deepEqual(
    after,
    baseline.fixture,
    "Browser measurements must not change the load fixture",
  );
  await writeFile(
    `${root}/browser-${mode}.json`,
    JSON.stringify(
      {
        mode,
        captured_at: new Date().toISOString(),
        source_head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        compiled_source: compiledSource,
        launcher_sha256: createHash("sha256")
          .update(await readFile("scripts/local-server.ts"))
          .digest("hex"),
        source_sha256: createHash("sha256")
          .update(await readFile("src/crm/directory.ts"))
          .digest("hex"),
        script_sha256: createHash("sha256")
          .update(await readFile("scripts/quality-customer-timeline.ts"))
          .digest("hex"),
        browser: browsers[0].version(),
        node: process.version,
        build_id: (await readFile(".next/BUILD_ID", "utf8")).trim(),
        fixture: baseline.fixture,
        fixture_after: after,
        groups,
        samples,
        limits:
          "Customers diagnostic timeline on unchanged compiled photo source 24d19b1 (build bXz2zLSgUTZhicOrJw-F3), separate from earlier PQ comparisons. Ten browser processes, four waves, desktop/phone, 40ms latency and 1.25MB/s download. Fresh fixture fingerprint retained before/after. Collection adds browser timeline and CDP listeners, so absolute timings are diagnostic and not a new before/after improvement claim. Target and readiness endpoint unchanged. Shared Windows host; no hosted, physical-device, CPU attribution or whole-database equality inferred.",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(groups));
} finally {
  await Promise.all(browsers.map((b) => b.close()));
  server.kill();
  await closeDatabase();
}
