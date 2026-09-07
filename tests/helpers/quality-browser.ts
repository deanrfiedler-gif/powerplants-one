import { expect, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
export async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : {
            Origin: "http://127.0.0.1:3000",
            "Content-Type": "application/json",
          },
    data: body,
  });
  const d = await r.json();
  expect(r.ok(), JSON.stringify(d)).toBe(true);
  expect(r.headers()["cache-control"]).toBe("private, no-store");
  return d;
}
export async function identity(page: Page, profile: string) {
  await expect(page.locator("#business-profile")).toBeEnabled();
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#business-profile")).toBeEnabled();
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
