import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { performanceFixtureFingerprint } from "./quality-performance-fixture";
import { closeDatabase } from "../src/platform/database";
import { waitForSampleCoreResponse } from "./quality-core-response";

// A one-browser request classification, not a ten-user performance comparison.
const root = "verification-evidence/customer-prefetch-classification";
await mkdir(root, { recursive: true });
const fixture = JSON.parse(
  await readFile(
    "verification-evidence/customer-loading-diagnosis/fixture.json",
    "utf8",
  ),
);
assert.deepEqual(await performanceFixtureFingerprint(), fixture.fixture);
assert.equal(
  (await readFile(".next/BUILD_ID", "utf8")).trim(),
  "bXz2zLSgUTZhicOrJw-F3",
);
execFileSync("git", [
  "diff",
  "--exit-code",
  "24d19b1",
  "--",
  "src",
  "db",
  "public",
  "package.json",
  "package-lock.json",
]);
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
  { stdio: "inherit", env: { ...process.env, PPO_PROOF_DIAGNOSTICS: "0" } },
);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const observations = [];
try {
  let ready = false;
  for (let i = 0; i < 240; i++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, "Compiled server ready within120s");
  browser = await chromium.launch({ channel: "chrome" });
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "phone", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.name === "phone",
      hasTouch: viewport.name === "phone",
    });
    assert.ok(
      (
        await context.request.post(`${origin}/api/v1/local-session`, {
          headers: { Origin: origin },
          data: { profile: "coordinator" },
        })
      ).ok(),
    );
    const page = await context.newPage();
    const requests: {
      at_ms: number;
      path: string;
      method: string;
      resource_type: string;
      rsc: boolean;
      next_prefetch: boolean;
      segment_prefetch: boolean;
      purpose_prefetch: boolean;
      rsc_query: boolean;
    }[] = [];
    const begin = performance.now();
    page.on("request", (request) => {
      const headers = request.headers(),
        url = new URL(request.url());
      requests.push({
        at_ms: performance.now() - begin,
        path: url.pathname,
        method: request.method(),
        resource_type: request.resourceType(),
        rsc: headers.rsc === "1",
        next_prefetch: headers["next-router-prefetch"] === "1",
        segment_prefetch: headers["next-router-segment-prefetch"] !== undefined,
        purpose_prefetch: /prefetch/i.test(
          headers.purpose ?? headers["sec-purpose"] ?? "",
        ),
        rsc_query: url.searchParams.has("_rsc"),
      });
    });
    const pending = waitForSampleCoreResponse(page, "/api/v1/crm/directory");
    void pending.catch(() => undefined);
    await page.goto(`${origin}/customers`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    const response = await pending;
    assert.ok(response.ok());
    const { observed_at: ignored, ...result } = await response.json();
    void ignored;
    assert.equal(
      createHash("sha256").update(JSON.stringify(result)).digest("hex"),
      fixture.expected_sha256,
    );
    await expect(
      page.getByRole("region", {
        name: "Local demonstration identity",
        exact: true,
      }),
    ).toHaveAttribute("aria-busy", "false", { timeout: 120000 });
    await expect(
      page.getByRole("button", { name: "Change identity", exact: true }),
    ).toBeEnabled({ timeout: 120000 });
    await expect(page.getByText(/^Loading .*…$/)).toHaveCount(0, {
      timeout: 120000,
    });
    await expect(page.locator('.business-error[role="alert"]')).toHaveCount(0);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const readyAt = performance.now() - begin;
    const names = page.locator(
      viewport.name === "phone"
        ? ".crm-directory-mobile-main strong"
        : ".crm-directory-table tbody th a",
    );
    assert.deepEqual(
      await names.allTextContents(),
      result.items.map((item: { display_name: string }) => item.display_name),
    );
    // Explicit observation window after readiness; not a wait substituted into a timing target.
    await page.waitForTimeout(1000);
    observations.push({
      viewport,
      ready_ms: readyAt,
      observation_end_ms: performance.now() - begin,
      requests,
    });
    await context.close();
  }
  assert.deepEqual(await performanceFixtureFingerprint(), fixture.fixture);
  await writeFile(
    `${root}/classification.json`,
    JSON.stringify(
      {
        source_head: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        compiled_source: "24d19b1f158efeb8ad97d62b50e516cbdac4d80e",
        script_sha256: createHash("sha256")
          .update(await readFile("scripts/quality-prefetch-classification.ts"))
          .digest("hex"),
        captured_at: new Date().toISOString(),
        browser: browser.version(),
        fixture: fixture.fixture,
        observations,
        limits:
          "Single browser, one fresh context per viewport, no network emulation. Header flags classify requests; no full headers/cookies/query values/body captured. Required content/readiness preserved. One-second post-ready observation is explicit. Counts are this bounded observation, not ten-user performance or all possible future navigation. No app behavior or cache policy changed.",
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      observations.map((o) => ({
        viewport: o.viewport.name,
        requests: o.requests.length,
        declared_prefetch: o.requests.filter(
          (r) => r.next_prefetch || r.segment_prefetch || r.purpose_prefetch,
        ).length,
        before_ready_prefetch: o.requests.filter(
          (r) =>
            r.at_ms <= o.ready_ms &&
            (r.next_prefetch || r.segment_prefetch || r.purpose_prefetch),
        ).length,
      })),
    ),
  );
} finally {
  await browser?.close();
  server.kill();
  await closeDatabase();
}
