import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const TRANSIENT_FETCH_RETRY_DELAY_MS = 250;
const PLAYWRIGHT_FETCH_ERROR = /^apiRequestContext\.fetch:/i;
const PLAYWRIGHT_FETCH_SOCKET_HANG_UP = /^apiRequestContext\.fetch: socket hang up\b/i;

export type TransientFetchRetry = {
  path: string;
  method: "GET" | "POST";
  message: string;
};

const transientFetchRetries: TransientFetchRetry[] = [];

/**
 * Transport resets absorbed by `call` during this process.
 *
 * A retried request still has to satisfy every assertion in `call`, so a
 * retry never converts a failing response into a passing one. It does hide
 * the reset itself, and reset-shaped failures are the P11 symptom class that
 * was never root-caused. Recording each one keeps a green run honest about
 * how much transport noise it absorbed, and turns that noise into a rate
 * that can be watched rather than an absence of evidence.
 */
export function transientFetchRetryRecord(): readonly TransientFetchRetry[] {
  return transientFetchRetries;
}

export function resetTransientFetchRetryRecord() {
  transientFetchRetries.length = 0;
}

function recordTransientFetchRetry(entry: TransientFetchRetry) {
  transientFetchRetries.push(entry);
  const description = `${entry.method} /api/v1/${entry.path} — ${entry.message}`;
  // Readable in the job log without downloading an artifact:
  // grep the log for "transient-fetch-retry:" to count absorbed resets.
  console.warn(`transient-fetch-retry: ${description}`);
  try {
    // Surfaces on the owning test in the Playwright report.
    test.info().annotations.push({ type: "transient-fetch-retry", description });
  } catch {
    // Called outside a Playwright runner, for example from the unit suite.
    // The record above and the log line remain the evidence.
  }
}

function isTransientFetchError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const { message, cause, code } = error as {
    message?: unknown;
    cause?: { message?: unknown; code?: unknown };
    code?: unknown;
  };
  if (typeof message !== "string" || !PLAYWRIGHT_FETCH_ERROR.test(message))
    return false;
  return (
    code === "ECONNRESET" ||
    cause?.code === "ECONNRESET" ||
    PLAYWRIGHT_FETCH_SOCKET_HANG_UP.test(message)
  );
}

export async function call(page: Page, path: string, body?: unknown) {
  const method = body === undefined ? "GET" : "POST";
  const request = () =>
    page.request.fetch(`/api/v1/${path}`, {
      method,
      headers:
        body === undefined
          ? {}
          : {
              Origin: "http://127.0.0.1:3000",
              "Content-Type": "application/json",
            },
      data: body,
    });
  let r;
  try {
    r = await request();
  } catch (error) {
    if (!isTransientFetchError(error)) throw error;
    recordTransientFetchRetry({
      path,
      method,
      message: String((error as { message?: unknown }).message ?? error),
    });
    await page.waitForTimeout(TRANSIENT_FETCH_RETRY_DELAY_MS);
    r = await request();
  }
  const d = await r.json();
  expect(r.ok(), JSON.stringify(d)).toBe(true);
  expect(r.headers()["cache-control"]).toBe("private, no-store");
  return d;
}
export async function openIdentityControls(page: Page) {
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
  if (!(await page.getByLabel("Identity", { exact: true }).isVisible()))
    await page.getByRole("button", { name: "Change identity", exact: true }).press("Enter");
  await expect(page.locator("#business-profile")).toBeEnabled();
}
export async function identity(page: Page, profile: string) {
  await openIdentityControls(page);
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  const changed = page.waitForResponse((r) =>
    new URL(r.url()).pathname === "/api/v1/local-session" &&
    r.request().method() === "POST");
  await page.getByRole("button", { name: "Use this identity", exact: true }).press("Enter");
  const response = await changed;
  expect(response.ok(), await response.text()).toBe(true);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  const current = await response.json();
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true }).locator("strong").first()).toHaveText(current.display_name);
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: "Change identity", exact: true })).toBeEnabled();
}
export async function capture(
  page: Page,
  info: TestInfo,
  scenario: string,
  extra: Record<string, unknown> = {},
) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mkdir(info.outputPath("."), { recursive: true });
  for (const fullPage of [false, true]) {
    const name = `P11-${scenario}${fullPage ? "-full" : ""}`;
    const bytes = await page.screenshot({
      path: info.outputPath(name + ".png"),
      fullPage,
    });
    await writeFile(
      info.outputPath(name + ".json"),
      JSON.stringify(
        {
          scenario,
          full_page: fullPage,
          viewport: page.viewportSize(),
          source_head: process.env.PPO_SOURCE_HEAD,
          executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
          executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
            encoding: "utf8",
          }).trim(),
          run_id: process.env.GITHUB_RUN_ID,
          run_attempt: process.env.GITHUB_RUN_ATTEMPT,
          byte_count: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          ...extra,
        },
        null,
        2,
      ),
    );
  }
}

// Read and preserve the issued bytes; this never asks a renderer to reproduce
// an existing output. Hash/provider/source identities stay separate.
export async function saveOriginal(
  page: Page,
  info: TestInfo,
  path: string,
  filename: string,
  source: Record<string, unknown>,
) {
  const response = await page.request.get(`/api/v1/${path}`);
  expect(response.ok(), `${path}: ${response.status()}`).toBe(true);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  const bytes = await response.body();
  const pdf = response.headers()["content-type"]?.includes("application/pdf");
  const pageCount = pdf
    ? [...bytes.toString("latin1").matchAll(/\/Type\s*\/Page\b/g)].length
    : null;
  if (pdf) expect(pageCount).toBeGreaterThan(0);
  await mkdir(info.outputPath("."), { recursive: true });
  await writeFile(info.outputPath(filename), bytes);
  await writeFile(
    info.outputPath(filename + ".proof.json"),
    JSON.stringify(
      {
        scenario: filename,
        source_head: process.env.PPO_SOURCE_HEAD,
        executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        route: path,
        viewport: page.viewportSize(),
        byte_count: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        page_count: pageCount,
        page_count_method: pdf
          ? "Pinned Chromium PDF /Type /Page objects; verify against original PDF inspection"
          : null,
        ...source,
      },
      null,
      2,
    ),
  );
  return bytes;
}
