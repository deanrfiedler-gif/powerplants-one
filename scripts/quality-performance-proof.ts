import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { cpus, totalmem, platform, release, arch } from "node:os";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { chromium, expect, type BrowserContext } from "@playwright/test";
import { closeDatabase, database } from "../src/platform/database";
import { qualityLoadFixture } from "./quality-load-fixture";

const root = "verification-evidence/p11-performance";
await mkdir(root, { recursive: true });
const origin = "http://127.0.0.1:3000";
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
  error: string | null;
}[] = [];
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
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
  browser = await chromium.launch();
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
        const context = await browser.newContext({
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
      for (const page of pages) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 40,
          downloadThroughput: 1250000,
          uploadThroughput: 625000,
          connectionType: "wifi",
        });
      }
      for (let wave = 0; wave < 4; wave++) {
        await Promise.all(
          pages.map(async (page, virtual_user) => {
            const at = performance.now();
            const coreEvents: { event: string; elapsed_ms: number; status?: number; error?: string }[] = [];
            const relevant = (request: import("@playwright/test").Request) =>
              new URL(request.url()).pathname === view.api && request.method() === "GET";
            const requested = (request: import("@playwright/test").Request) => {
              if (relevant(request) && coreEvents.length < 20)
                coreEvents.push({ event: "request", elapsed_ms: performance.now() - at });
            };
            const responded = (response: import("@playwright/test").Response) => {
              if (relevant(response.request()) && coreEvents.length < 20)
                coreEvents.push({ event: "response", elapsed_ms: performance.now() - at, status: response.status() });
            };
            const failed = (request: import("@playwright/test").Request) => {
              if (relevant(request) && coreEvents.length < 20)
                coreEvents.push({ event: "request-failed", elapsed_ms: performance.now() - at, error: request.failure()?.errorText ?? "Unknown transport failure" });
            };
            page.on("request", requested).on("response", responded).on("requestfailed", failed);
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
              await expect(page.locator("#business-profile")).toBeEnabled({
                timeout: 120000,
              });
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
              finished = performance.now();
            } catch (e) {
              finished = performance.now();
              error = e instanceof Error ? e.message : "Read failed";
              {
                const name = `${viewport.name}-${view.name.replaceAll(" ", "-")}-wave-${wave}-user-${virtual_user}-failure`;
                const bytes = await page
                  .screenshot({
                    path: `${root}/${name}.png`,
                    fullPage: true,
                    timeout: 10000,
                  })
                  .catch(() => null);
                await writeFile(
                  `${root}/${name}-proof.json`,
                  JSON.stringify(
                    {
                      ...provenance,
                      viewport,
                      scenario: name,
                      error,
                      core_events: coreEvents,
                      diagnostic_limit: "At most 20 method/path-matched core GET event timings and statuses; no bodies, headers, query strings, cookies or session trace. Capture time is outside the completed sample.",
                      byte_count: bytes?.length ?? null,
                      sha256: bytes
                        ? createHash("sha256").update(bytes).digest("hex")
                        : null,
                      business_errors: await page
                        .locator('.business-error[role="alert"]')
                        .allTextContents()
                        .catch(() => []),
                    },
                    null,
                    2,
                  ),
                );
              }
            } finally {
              page.off("request", requested).off("response", responded).off("requestfailed", failed);
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
              error,
            });
          }),
        );
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
          browser: browser.version(),
          platform: platform(),
          os_release: release(),
          arch: arch(),
          cpu: cpus().map((c) => c.model),
          memory_bytes: totalmem(),
          network: {
            method: "Chromium DevTools browser network emulation",
            latency_ms: 40,
            download_bytes_per_second: 1250000,
            upload_bytes_per_second: 625000,
            server_database:
              "same disposable CI runner; loopback PostgreSQL 16.15",
          },
          build:
            "Pinned Next.js guarded development server after successful production compilation check. Development compiler filesystem cache remains disabled. Production hosting/start remains prohibited.",
          concurrency:
            "10 independent browser contexts and server-issued sessions per view wave; role-appropriate existing synthetic Coordinator or assigned Technician identity. These are 10 virtual users, not 10 distinct staff identities.",
          cold_warm:
            "Each view begins with 10 fresh contexts, empty browser caches and no preceding measured navigation in those contexts. Only the first desktop visit can include first route compilation in this shared fresh server; later views/phone can reuse server modules and database/OS caches. Warm is three subsequent navigation waves in the same contexts. No OS cache flush or durable offline-storage inference.",
          boundary:
            "Browser navigation initiation to successful core API response, enabled identity selector, completed loading, no business error and two animation frames. Authentication setup is outside the timed boundary; navigation, HTML, assets, API and rendering are inside.",
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
  await browser?.close();
  if (server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGTERM");
    await stopped;
  }
  await closeDatabase();
}
