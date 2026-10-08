import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { performanceFixtureFingerprint } from "./quality-performance-fixture";
import { closeDatabase } from "../src/platform/database";
import { waitForSampleCoreResponse } from "./quality-core-response";
const mode = process.argv[2];
assert.ok(mode === "baseline" || mode === "candidate");
const root = "verification-evidence/directory-quality";
await mkdir(root, { recursive: true });
const baseline = JSON.parse(await readFile(`${root}/baseline.json`, "utf8"));
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
const browsers: Awaited<ReturnType<typeof chromium.launch>>[] = [];
const samples: {
  viewport: string;
  wave: number;
  user: number;
  ready_ms: number;
  core_ms: number;
  core_response_ms: number;
  core_requests: number;
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
          const responsePromise = waitForSampleCoreResponse(
            page,
            "/api/v1/crm/directory",
          );
          await page.goto(origin + "/customers", {
            waitUntil: "domcontentloaded",
            timeout: 120000,
          });
          const response = await responsePromise;
          assert.ok(response.ok());
          const { observed_at: observedAt, ...result } = await response.json();
          void observedAt;
          const received = performance.now();
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
          await expect(
            page.locator('.business-error[role="alert"]'),
          ).toHaveCount(0);
          await page.evaluate(
            () =>
              new Promise<void>((r) =>
                requestAnimationFrame(() => requestAnimationFrame(() => r())),
              ),
          );
          const settledAt = performance.now();
          const expected = baseline.comparisons.find(
            (c: { profile: string; input: { kind: string; sort: string } }) =>
              c.profile === "coordinator" &&
              c.input.kind === "organisations" &&
              c.input.sort === "name",
          );
          assert.equal(
            createHash("sha256").update(JSON.stringify(result)).digest("hex"),
            expected.output_sha256,
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
          });
          page.off("request", listener);
        }),
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
    await pages[0].screenshot({ path: `${root}/${mode}-${viewport.name}.png` });
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
        source_sha256: createHash("sha256")
          .update(await readFile("src/crm/directory.ts"))
          .digest("hex"),
        script_sha256: createHash("sha256")
          .update(await readFile("scripts/quality-customer-browser-proof.ts"))
          .digest("hex"),
        browser: browsers[0].version(),
        node: process.version,
        build_id: (await readFile(".next/BUILD_ID", "utf8")).trim(),
        fixture: baseline.fixture,
        fixture_after: after,
        groups,
        samples,
        limits:
          "Focused Customers compiled-browser comparison on one Windows host; ten browser processes, four waves, desktop/phone, 40ms latency and 1.25MB/s download. Ordered runs reuse exact load fixture. Separate from the full PT-27 suite and hosted latency. No target change or production inference.",
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
