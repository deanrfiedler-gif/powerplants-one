import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import { CRM, librarySetup } from "../helpers/library";

// Real application and disposable database; no fulfilled library API fixtures.
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
test.beforeAll(async () => {
  await librarySetup();
});
test.afterAll(closeDatabase);
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (route) =>
    route.abort(),
  );
});

async function session(page: Page, profile: string) {
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
        data: { profile },
      })
    ).status(),
  ).toBe(200);
}
async function submit(page: Page, button: string, suffix: string) {
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN native browser proof");
  const result = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      new URL(r.url()).pathname === `/api/v1/document-library${suffix}`,
  );
  await dialog.getByRole("button", { name: button, exact: true }).click();
  const response = await result;
  expect(response.ok()).toBe(true);
  await expect(dialog).toBeHidden();
  return {
    command: response.request().postDataJSON(),
    receipt: await (
      await page.request.get(
        `/api/v1/operations/${response.request().postDataJSON().operation_id}`,
      )
    ).json(),
  };
}
async function register(page: Page, text: string) {
  await session(page, "coordinator");
  await page.goto("/documents");
  await page
    .getByRole("button", { name: "Register document", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  for (const [label, id] of [
    ["Company", CRM.company],
    ["Customer", CRM.org],
    ["Site", CRM.site],
    ["Owner", CRM.owner],
  ]) {
    await expect(
      dialog
        .getByLabel(label, { exact: true })
        .locator(`option[value="${id}"]`),
    ).toHaveCount(1);
    await dialog.getByLabel(label, { exact: true }).selectOption(id);
  }
  const title = `SYN native library ${randomUUID().slice(0, 8)}`;
  await dialog.getByLabel("Title", { exact: true }).fill(title);
  await dialog
    .getByLabel("Audience", { exact: true })
    .fill("SYN internal verification");
  await dialog
    .getByLabel("Applicability", { exact: true })
    .fill("SYN disposable browser evidence only");
  await dialog.getByLabel("Exact synthetic text", { exact: true }).fill(text);
  const result = await submit(page, "Register", "");
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  return {
    ...result,
    title,
    path: `/documents/library/${result.receipt.record_id}`,
    api: `/${result.receipt.record_id}`,
  };
}
async function action(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Document actions", exact: true })
    .click();
  await page.getByRole("button", { name, exact: true }).click();
}
async function download(page: Page, label: string, expected: string) {
  const ready = page.waitForEvent("download");
  await page.getByRole("link", { name: label, exact: true }).click();
  const file = await ready;
  expect(await readFile((await file.path())!, "utf8")).toBe(expected);
}

test("DK native browser: independent findings, review, exact history and missing-byte recovery", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const original = "SYN native browser original\nRetained exact revision one.";
  const doc = await register(page, original);
  await expect(
    page.getByText("An independent reviewer is required.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review r01", exact: true }),
  ).toHaveCount(0);
  await download(page, "Download r01", original);
  await page.getByRole("tab", { name: "Findings", exact: true }).click();
  await page
    .getByRole("button", { name: "Open a finding", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Finding owner", { exact: true })
    .selectOption(CRM.owner);
  await dialog.getByLabel("Due date", { exact: true }).fill("2031-11-01");
  await dialog
    .getByLabel("Finding", { exact: true })
    .fill("SYN check original exact content");
  await submit(page, "Open finding", `${doc.api}/findings`);
  await page.getByRole("button", { name: "Respond", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Response", { exact: true })
    .fill("SYN original confirmed");
  await submit(page, "Respond", `${doc.api}/findings`);
  await expect(
    page.getByRole("button", { name: "Accept response", exact: true }),
  ).toHaveCount(0);
  await session(page, "cs-reviewer");
  await page.reload();
  await page.getByRole("tab", { name: "Findings", exact: true }).click();
  await page
    .getByRole("button", { name: "Accept response", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Acceptance", { exact: true })
    .fill("SYN independently checked");
  await submit(page, "Accept response", `${doc.api}/findings`);
  await page.getByRole("button", { name: "Review r01", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Purpose", { exact: true })
    .fill("SYN internal reference");
  await dialog
    .getByLabel("Rationale", { exact: true })
    .fill("SYN exact r01 and closed finding checked");
  await submit(page, "Record review", `${doc.api}/review`);
  await session(page, "coordinator");
  await page.reload();
  await page.getByRole("tab", { name: "Links", exact: true }).click();
  await page.getByRole("button", { name: "Add a link", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Target", { exact: true }).selectOption(CRM.site);
  await dialog
    .getByLabel("Purpose", { exact: true })
    .fill("SYN declared site reference");
  await submit(page, "Add link", `${doc.api}/links`);
  await page.getByRole("button", { name: "Add revision", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Exact synthetic text", { exact: true })
    .fill("SYN different successor bytes");
  await submit(page, "Revise", `${doc.api}/revisions`);
  await expect(
    page.getByRole("link", { name: "Download r02", exact: true }),
  ).toBeVisible();
  const current = await (
    await page.request.get(`/api/v1/document-library${doc.api}`)
  ).json();
  expect(current.review_state).toBe("Unreviewed");
  expect(current.findings).toHaveLength(0);
  const historical = `${doc.path}?revision_id=${doc.command.revision_id}`;
  await page.goto(historical);
  await download(page, "Download r01", original);
  const old = await (
    await page.request.get(
      `/api/v1/document-library${doc.api}?revision_id=${doc.command.revision_id}`,
    )
  ).json();
  expect(old.review_state).toBe("Reviewed");
  expect(old.findings).toHaveLength(1);
  expect(old.findings[0].state).toBe("Closed");
  await page.getByRole("tab", { name: "Links", exact: true }).click();
  await expect(
    page.getByText("SYN declared site reference", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(/review/i);
  // Only this test's original file is removed; verify its bytes before removal.
  const stored = join(
    process.env.PPO_DOCUMENT_DIRECTORY ??
      join(homedir(), ".ppo-synthetic-documents"),
    CRM.workspace,
    doc.command.operation_id,
  );
  expect(JSON.parse(await readFile(stored, "utf8"))).toMatchObject({
    text: original,
    document_id: doc.receipt.record_id,
    revision_id: doc.command.revision_id,
    operation_id: doc.command.operation_id,
  });
  await unlink(stored);
  await page.reload();
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(
    page.getByText("Exact content unavailable", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Download r01", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const missing = await page.request.get(
    `/api/v1/document-library${doc.api}/content?revision_id=${doc.command.revision_id}`,
  );
  expect(missing.status()).toBe(503);
  expect((await missing.json()).code).toBe("ExactDocumentUnavailable");
  await page.screenshot({
    path: test.info().outputPath("native-historical-unavailable-320.png"),
    fullPage: true,
  });
  await action(page, "Recover exact content");
  await page
    .getByRole("dialog")
    .getByLabel("Original exact synthetic text", { exact: true })
    .fill(original);
  await submit(page, "Recover", `${doc.api}/recover`);
  await download(page, "Download r01", original);
  await page.goto(doc.path);
  await download(page, "Download r02", "SYN different successor bytes");
  await action(page, "Withdraw document");
  await submit(page, "Withdraw", `${doc.api}/withdraw`);
  await expect(
    page.getByText("Withdrawn document. Retained evidence remains readable.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(historical);
  await download(page, "Download r01", original);
  await session(page, "second-company");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: doc.title, exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await page.request.get(
        `/api/v1/document-library${doc.api}/content?revision_id=${doc.command.revision_id}`,
      )
    ).status(),
  ).toBe(404);
});

test("DK native browser: stale save, lost committed response, keyboard and phone snapshot", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const doc = await register(page, "SYN replay original");
  await page.getByRole("button", { name: "Add revision", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Exact synthetic text", { exact: true })
    .fill("SYN preserved draft");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN stale save proof");
  const concurrent = await page.request.post(
    `/api/v1/document-library${doc.api}/links`,
    {
      headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
      data: {
        operation_id: randomUUID(),
        schema_version: 1,
        reason: "SYN concurrent reference",
        expected_version: 1,
        revision_id: doc.command.revision_id,
        action: "Add",
        link_id: randomUUID(),
        target_kind: "Site",
        target_id: CRM.site,
        purpose: "SYN explicit reference",
      },
    },
  );
  expect(concurrent.ok(), await concurrent.text()).toBe(true);
  const stale = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().endsWith(`${doc.api}/revisions`),
  );
  await dialog.getByRole("button", { name: "Revise", exact: true }).click();
  expect((await stale).status()).toBe(409);
  await expect(
    dialog.getByText("The record or source changed.", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel("Exact synthetic text", { exact: true }),
  ).toHaveValue("SYN preserved draft");
  page.once("dialog", (confirmation) => confirmation.accept());
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await action(page, "Refresh");
  await page.getByRole("button", { name: "Add revision", exact: true }).click();
  await dialog
    .getByLabel("Exact synthetic text", { exact: true })
    .fill("SYN recovered committed successor");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN uncertain outcome proof");
  const bodies: unknown[] = [];
  let committed: unknown;
  await page.route(
    `**/api/v1/document-library${doc.api}/revisions`,
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      bodies.push(route.request().postDataJSON());
      if (bodies.length > 1) return route.continue();
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      committed = await response.json();
      // The server commits; only delivery of its response is deliberately lost.
      await route.abort("failed");
    },
  );
  await dialog.getByRole("button", { name: "Revise", exact: true }).click();
  await expect(
    dialog.getByText("Original operation retained.", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByLabel("Exact synthetic text", { exact: true }),
  ).toBeDisabled();
  const replay = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      r.url().endsWith(`${doc.api}/revisions`),
  );
  await dialog
    .getByRole("button", { name: "Retry original operation", exact: true })
    .click();
  const replayed = await replay;
  expect(replayed.status()).toBe(200);
  expect(await replayed.json()).toEqual(committed);
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toEqual(bodies[0]);
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Download r02", exact: true }),
  ).toBeVisible();
  const revisions = await (
    await page.request.get(`/api/v1/document-library${doc.api}/revisions`)
  ).json();
  expect(revisions.items).toHaveLength(2);

  await page.setViewportSize({ width: 320, height: 844 });
  const overview = page.getByRole("tab", { name: "Overview", exact: true });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /^Revisions/ })).toBeFocused();
  await expect(page.getByRole("tab", { name: /^Revisions/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "History", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(overview).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("native-record-320.png"),
    fullPage: true,
  });
  await page.goto(`/documents?q=${encodeURIComponent(doc.title)}`);
  const snapshot = page.getByRole("button", {
    name: "Snapshot",
    exact: true,
  });
  await snapshot.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("complementary", {
      name: `Snapshot of ${doc.title}`,
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("native-snapshot-320.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(snapshot).toBeFocused();
});

async function zoomCapture(page: Page, name: string) {
  // Capture the physical viewport. Playwright fullPage clips using CSS dimensions
  // at browser zoom and would retain only the top-left quarter of this view.
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const bytes = Buffer.from(data, "base64");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1440, 900]);
  await writeFile(test.info().outputPath(name), bytes);
  await cdp.detach();
}

// Chrome's own setting changes layout zoom; this is not CSS zoom or a reduced viewport.
test("DK native browser: 200 percent Chrome zoom reflows register and record", async () => {
  const { chromium } = await import("@playwright/test");
  const context = await chromium.launchPersistentContext("", {
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    baseURL: test.info().project.use.baseURL,
    locale: "en-AU",
  });
  try {
    const page = await context.newPage();
    await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (route) =>
      route.abort(),
    );
    const doc = await register(page, "SYN zoom reference");
    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await expect(settings.locator("#zoomLevel")).toHaveValue("2");
    await settings.close();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: doc.title, exact: true }),
    ).toBeVisible();
    const metrics = await page.evaluate(() => ({
      width: innerWidth,
      scale: devicePixelRatio,
    }));
    expect(metrics).toEqual({ width: 720, scale: 2 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await zoomCapture(page, "native-record-zoom200.png");
    await page.getByRole("tab", { name: "Overview", exact: true }).focus();
    await page.keyboard.press("End");
    await expect(
      page.getByRole("tab", { name: "History", exact: true }),
    ).toBeFocused();
    await page.goto(`/documents?q=${encodeURIComponent(doc.title)}`);
    await expect(
      page.getByRole("link", { name: new RegExp(`^${doc.title} `) }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await zoomCapture(page, "native-register-zoom200.png");
  } finally {
    await context.close();
  }
});
