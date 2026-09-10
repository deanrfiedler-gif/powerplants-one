import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { prepareFieldAppointment } from "../helpers/field-http";
import { base, entry, startInput } from "../helpers/field";
import { operation } from "../helpers/offline";
import { identity, openIdentityControls } from "../helpers/quality-browser";

test.describe.configure({ timeout: 180000 });
async function call(page: Page, path: string, body?: unknown) {
  const response = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" }, data: body,
  });
  const result = await response.json();
  expect(response.ok(), JSON.stringify(result)).toBe(true);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  return result;
}
async function capture(page: Page, info: TestInfo, scenario: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir(info.outputPath("."), { recursive: true });
  for (const fullPage of [false, true]) {
    const name = `P11-${scenario}${fullPage ? "-full" : ""}`;
    const bytes = await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage });
    await writeFile(info.outputPath(`${name}.json`), JSON.stringify({ scenario, full_page: fullPage, viewport: page.viewportSize(), source_head: process.env.PPO_SOURCE_HEAD, executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim(), run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT, byte_count: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }, null, 2));
  }
}

test("P11 PT-01 cross-tab identity change removes business and diagnostic records before reload", async ({ page, context }, info) => {
  await page.goto("/customers"); await identity(page, "coordinator");
  await expect(page.getByRole("link", { name: "SYN Greenhouse Demonstration", exact: true })).toHaveCount(2);
  const other = await context.newPage(); await other.goto("/customers");
  await expect(other.getByRole("link", { name: "SYN Greenhouse Demonstration", exact: true })).toHaveCount(2);
  const diagnostic = await context.newPage(); await diagnostic.goto("/foundation");
  await diagnostic.getByRole("button", { name: "Load shared context" }).click();
  await expect(diagnostic.getByText("SYN Former Technician", { exact: false })).toBeVisible();
  let releaseSwitch: () => void = () => {};
  const switching = new Promise<void>(resolve => { releaseSwitch = resolve; });
  await page.route("**/api/v1/local-session", async route => {
    if (route.request().method() === "POST") await switching;
    await route.continue();
  });
  await openIdentityControls(page);
  await page.getByLabel("Identity", { exact: true }).selectOption("systems");
  await page.getByRole("button", { name: "Use this identity", exact: true }).click();
  try {
    await expect(other.getByRole("heading", { name: "Refresh your identity context", exact: true })).toBeVisible();
    await other.getByRole("button", { name: "Reload permitted view" }).click();
    await expect(other.getByRole("link", { name: "SYN Greenhouse Demonstration", exact: true })).toHaveCount(2);
  } finally { releaseSwitch(); }
  await expect(page.getByRole("region", { name: "Local demonstration identity", exact: true })).toHaveAttribute("aria-busy", "false");
  await page.unroute("**/api/v1/local-session");
  for (const tab of [other, diagnostic]) {
    await expect(tab.getByRole("heading", { name: "Refresh your identity context", exact: true })).toBeVisible();
    await expect(tab.getByText("SYN Former Technician", { exact: false })).toHaveCount(0);
    await expect(tab.getByRole("link", { name: "SYN Greenhouse Demonstration", exact: true })).toHaveCount(0);
  }
  await capture(other, info, "cross-tab-locked");
  await other.getByRole("button", { name: "Reload permitted view" }).focus();
  await other.keyboard.press("Enter");
  await expect(other.getByRole("alert").filter({ hasText: "permission" })).toBeVisible();
  await expect(other.getByRole("link", { name: "SYN Greenhouse Demonstration", exact: true })).toHaveCount(0);
  await capture(other, info, "cross-tab-current-authority");
});

test("P11 PT-27/29 shared validation links the actual control and retains entered values", async ({ page }, info) => {
  await page.goto("/customers/new"); await identity(page, "coordinator");
  await page.getByLabel("Company visibility context").selectOption("20000000-0000-4000-8000-000000000001");
  await page.getByLabel("Relationship / site owner").selectOption({ label: "SYN Coordinator" });
  await page.getByLabel("Display name", { exact: true }).fill("SYN retained proposed organisation");
  await page.getByLabel("Reason for capture", { exact: true }).fill("SYN deliberate validation challenge");
  await page.route("**/api/v1/customers", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ message: "Check the highlighted details.", field_errors: [{ field: "display_name", message: "SYN explicit field validation challenge" }], retryable: false }) });
  });
  await page.getByRole("button", { name: "Save record", exact: true }).focus(); await page.keyboard.press("Enter");
  const summary = page.getByRole("alert").filter({ hasText: "SYN explicit field validation" });
  await expect(summary).toBeFocused();
  const fieldLink = summary.getByRole("link", { name: /SYN explicit field validation/ });
  await expect(fieldLink).toHaveAttribute("href", "#shared-name");
  await fieldLink.focus(); await page.keyboard.press("Enter");
  await expect(page.getByLabel("Display name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("SYN retained proposed organisation");
  await capture(page, info, "linked-validation-retained");
});

test("P11 PT-01/29 scoped recovery UI preserves originals and retries one uncertain disposition", async ({ page }, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const setup = await prepareFieldAppointment((path, body) => call(page, path, body), info.project.name.startsWith("desktop") ? "2026-10-22" : "2026-10-23");
  for (const profile of ["assigned-technician", "second-technician"]) {
    const p = await call(page, "local-session", { profile });
    const recipient = setup.pack.readiness.recipients.find((r: { user_id: string }) => r.user_id === p.actor_id);
    await call(page, `pack-issues/${setup.pack.current_issue_id}/acknowledge`, { ...base(), assignment_id: recipient.assignment_id, assignment_version: recipient.assignment_version, presented_hash: setup.pack.issues[0].output_hash, captured_at: new Date().toISOString() });
  }
  const p = await call(page, "local-session", { profile: "assigned-technician" });
  let job = (await call(page, `my-jobs/${setup.appointment_id}`)).items[0];
  await call(page, `appointments/${job.id}/start`, startInput(job));
  job = (await call(page, `my-jobs/${job.id}`)).items[0];
  const grant = await call(page, `sync/context/${job.id}`, {});
  const original = operation(p, job, "Capture", entry(job));
  const saved = await call(page, "sync/recovery", { grant_id: grant.recovery.id, token: grant.recovery.token, operation: original });
  expect(saved.normal_acceptance).toBe(false);
  await page.goto("/customers"); await identity(page, "coordinator");
  if (info.project.use.isMobile) await page.getByRole("button", { name: "Menu", exact: true }).press("Enter");
  if (!info.project.use.isMobile) await page.getByRole("button", { name: "More", exact: true }).press("Enter");
  await page.getByRole("navigation", { name: info.project.use.isMobile ? "All modules" : "More navigation", exact: true }).getByRole("link", { name: "Exceptions and recovery", exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/admin$/);
  if (info.project.use.isMobile) {
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: 320, height: viewport.height });
    const heading = await page.locator(".topbar .product-heading").boundingBox();
    const identityButton = await page.getByRole("button", { name: "Change identity", exact: true }).boundingBox();
    expect(heading).not.toBeNull(); expect(identityButton).not.toBeNull();
    expect(heading!.x + heading!.width).toBeLessThanOrEqual(identityButton!.x);
    await capture(page, info, "recovery-header-320");
    await page.setViewportSize(viewport);
  }
  await expect(page.locator(`a[href='/admin/recovery/${saved.case_id}']`)).toBeVisible();
  await capture(page, info, "recovery-loaded");
  await page.locator(`a[href='/admin/recovery/${saved.case_id}']`).click();
  await page.getByLabel("Review position").selectOption("ClarificationRequired");
  const note = "SYN confirm the retained original with its technician before any separate review or approval. ".repeat(12);
  await page.getByLabel("Review note").fill(note);
  await page.getByLabel("Reason for review").fill("SYN retained original needs clarification");
  let lost = false;
  const requests: unknown[] = [];
  await page.route(`**/api/v1/sync/recovery-review/${saved.case_id}/disposition`, async (route) => {
    requests.push(route.request().postDataJSON());
    if (!lost) { lost = true; const result = await route.fetch(); expect(result.ok()).toBe(true); await route.abort("failed"); }
    else await route.continue();
  });
  await page.getByRole("button", { name: "Save review position" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "could not be confirmed" })).toBeVisible();
  await expect(page.getByLabel("Review note")).toHaveValue(note);
  await capture(page, info, "recovery-uncertain-retained");
  await page.getByRole("button", { name: "Save review position" }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("listitem").filter({ hasText: note.trim() })).toHaveCount(1);
  await expect(page.getByRole("status").filter({ hasText: "Review position saved to the server." })).toBeVisible();
  expect(requests).toHaveLength(2); expect(requests[0]).toEqual(requests[1]);
  const current = await call(page, `sync/recovery-review/${saved.case_id}`);
  const { payload_hash: originalHash, ...originalEnvelope } = original;
  expect(current.envelope).toEqual(originalEnvelope);
  expect(current.payload_hash).toBe(originalHash);
  expect(current.dispositions).toHaveLength(1);
  const normal = (await call(page, `appointments/${setup.appointment_id}`)).items[0];
  expect(normal.status).toBe("InProgress");
  await page.locator("summary").filter({ hasText: "Original evidence and source identity" }).click();
  await expect(page.getByLabel("Original retained evidence")).toBeVisible();
  await expect(page.getByLabel("Original retained evidence")).toContainText(original.operation_id);
  await capture(page, info, "recovery-original-once");
  await page.setViewportSize({ width: 320, height: 844 });
  await capture(page, info, "recovery-320");
  // Change the actual server session without the UI signal; a denied command must clear its source.
  await call(page, "local-session", { profile: "systems" });
  await page.getByLabel("Review note").fill("SYN this denied command must not keep the original on screen");
  await page.getByLabel("Reason for review").fill("SYN current authority changed");
  await page.getByRole("button", { name: "Save review position" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "permission" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Review position saved to the server." })).toHaveCount(0);
  await expect(page.getByLabel("Review note")).toHaveCount(0);
  await expect(page.getByText(original.operation_id, { exact: false })).toHaveCount(0);
  await capture(page, info, "recovery-command-denied");
  await identity(page, "systems");
  await expect(page.getByRole("alert").filter({ hasText: "permission" })).toBeVisible();
  await expect(page.getByLabel("Review note")).toHaveCount(0);
  await expect(page.getByText(original.operation_id, { exact: false })).toHaveCount(0);
  const denied = await page.request.get(`/api/v1/sync/recovery-review/${saved.case_id}`);
  expect(denied.status()).toBe(403); expect(await denied.text()).not.toContain(original.operation_id);
  await capture(page, info, "recovery-denied");
});

test("P11 PT-29 exceptions distinguish loading, failed, empty and restricted windows", async ({ page }, info) => {
  await page.goto("/admin"); await identity(page, "coordinator");
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/v1/sync/recovery-review", async (route) => { await pending; await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "SYN recovery query unavailable", retryable: true }) }); });
  await page.getByRole("button", { name: "Refresh recovery cases" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Loading" })).toBeVisible();
  await expect(page.getByText("No permitted recovery cases in this window.", { exact: true })).toHaveCount(0);
  await capture(page, info, "recovery-loading"); release();
  await expect(page.getByRole("alert").filter({ hasText: "SYN recovery query unavailable" })).toBeVisible();
  await capture(page, info, "recovery-query-failed");
  await page.unroute("**/api/v1/sync/recovery-review");
  await page.route("**/api/v1/sync/recovery-review", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) }));
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.getByText("No permitted recovery cases in this window.", { exact: true })).toBeVisible();
  await capture(page, info, "recovery-empty");
  await page.unroute("**/api/v1/sync/recovery-review"); await identity(page, "systems");
  await expect(page.getByRole("alert").filter({ hasText: "permission" })).toBeVisible();
  await expect(page.getByText("No permitted recovery cases in this window.", { exact: true })).toHaveCount(0);
  await capture(page, info, "recovery-list-denied");
});
