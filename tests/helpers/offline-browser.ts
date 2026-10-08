import {
  expect,
  type Page,
  type TestInfo,
  type APIRequestContext,
} from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { prepareFieldAppointment } from "./field-http";
import { prepareIsolatedFieldAppointment } from "./isolated-field-http";
import { base } from "./field";
export const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
export async function call(
  request: APIRequestContext,
  path: string,
  body?: unknown,
) {
  const r = await request.fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" },
    data: body,
  });
  const data = await r.json();
  expect(r.ok(), JSON.stringify(data)).toBeTruthy();
  return data;
}
export async function login(request: APIRequestContext, profile: string) {
  return call(request, "local-session", { profile });
}
export async function prepared(page: Page, day: string, isolated = false) {
  await login(page.request, "coordinator");
  const setup = await (
    isolated ? prepareIsolatedFieldAppointment : prepareFieldAppointment
  )((path, body) => call(page.request, path, body), day);
  for (const profile of ["assigned-technician", "second-technician"]) {
    const p = await login(page.request, profile),
      recipient = setup.pack.readiness.recipients.find(
        (x: { user_id: string }) => x.user_id === p.actor_id,
      );
    await call(
      page.request,
      `pack-issues/${setup.pack.current_issue_id}/acknowledge`,
      {
        ...base(),
        assignment_id: recipient.assignment_id,
        assignment_version: recipient.assignment_version,
        presented_hash: setup.pack.issues[0].output_hash,
        captured_at: new Date().toISOString(),
      },
    );
  }
  await login(page.request, "assigned-technician");
  return setup;
}
export async function open(page: Page, id: string) {
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.getByLabel("Assigned job to download").selectOption(id);
  await page
    .getByRole("button", { name: "Download selected job", exact: true })
    .click();
  // Identity, context and exact HTML are separate bounded requests. Wait for
  // their completion before asserting the durable local-save result.
  await expect(
    page.getByRole("button", { name: "Download selected job", exact: true }),
  ).toBeEnabled({ timeout: 45000 });
  await expect(page.locator("#notice")).toContainText(
    "Job context and exact pack saved",
  );
  await expect(page.locator("#jobs article")).toHaveCount(1);
  await expect(page.locator("#capture-form")).toBeVisible();
}
export async function note(
  page: Page,
  text = "SYN offline factual observation; uncertain identity remains explicit",
) {
  await page
    .getByLabel("Evidence type", { exact: true })
    .selectOption("Observation");
  await page.getByLabel("Finding", { exact: true }).fill(text);
  await page
    .getByLabel("Attempted fix", { exact: true })
    .fill("SYN visual-only check; no intervention");
  await page
    .getByLabel("Result, including unsuccessful work", { exact: true })
    .fill("SYN label remains unclear; technical follow-up required");
  await page
    .getByLabel("Capture context", { exact: true })
    .fill("SYN original offline evidence within inspection scope");
}
export async function save(page: Page) {
  const before = await page.locator("#queue .queue-row").count(),
    increment =
      (await page.getByLabel("Evidence type", { exact: true }).inputValue()) ===
      "Photo"
        ? 4
        : 1;
  await page
    .getByRole("button", { name: "Save evidence on this device", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(
    before + increment,
  );
  await expect(page.locator("#capture-form")).toContainText(
    "Saved on this device — awaiting server acceptance.",
  );
}
export async function screenshot(page: Page, info: TestInfo, scenario: string) {
  await page.evaluate(() => scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const bytes = await page.screenshot({
    path: info.outputPath(`P08-${scenario}.png`),
    fullPage: true,
  });
  await writeFile(
    info.outputPath(`P08-${scenario}.json`),
    JSON.stringify(
      {
        scenario,
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        source_head: process.env.PPO_SOURCE_HEAD ?? process.env.GITHUB_SHA,
        source_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        viewport: page.viewportSize(),
        url: page.url(),
        captured_at: new Date().toISOString(),
        byte_count: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
      null,
      2,
    ),
  );
}
export async function localRows(page: Page) {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      s = await import(path),
      p = (await s.ownership()).owner;
    return s.queue(p);
  });
}
