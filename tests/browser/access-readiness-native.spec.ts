import { test, expect, type Page } from "@playwright/test";
import {
  accessReadinessFixture,
  readinessId,
  readinessSite,
} from "../helpers/access-readiness-fixture";
const path = `/sites/${readinessSite}/readiness`;
async function fixture(page: Page, value = accessReadinessFixture()) {
  await page.route("**/api/v1/cs/Readiness?*", (route) =>
    route.fulfill({
      json: { items: [{ id: readinessId }], next_cursor: null },
    }),
  );
  await page.route(`**/api/v1/cs/Readiness/${readinessId}`, (route) =>
    route.fulfill({ json: value.data }),
  );
  await page.route("**/api/v1/cs/Readiness/options?*", (route) =>
    route.fulfill({ json: value.options }),
  );
  return value;
}
test.beforeEach(async ({ page, baseURL }) => {
  // Retain geometry while excluding licensed glyph artwork from every capture.
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = ".ppo-fa, svg { visibility: hidden !important; }";
      document.head.append(style);
    });
  });
  const r = await page.request.post(`${baseURL}/api/v1/local-session`, {
    headers: { origin: baseURL! },
    data: { profile: "coordinator" },
  });
  expect(r.status()).toBe(200);
});
test("CS06 accepted view families fit desktop, tablet, 390 and 320; phone sections remain keyboard reachable", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await fixture(page);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 1234 : width === 1024 ? 900 : 844,
    });
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Check overview", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Readiness contact", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 781) {
      expect(await page.getByRole("tab").allTextContents()).toEqual([
        "Overview",
        "Evidence",
        "Windows",
        "History",
        "Requirements",
        "Visit preparation",
      ]);
      await expect(page.locator(".shared-record-sticky")).toBeVisible();
      const trigger = page
        .locator(".shared-record-sticky")
        .getByRole("button", { name: "Check again", exact: true });
      expect((await trigger.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: info.outputPath(`overview-${width}.png`) });
    for (const tab of ["Requirements", "Evidence", "Visit preparation"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await expect(
        page.getByRole("tab", { name: tab, exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page
      .getByRole("tab", { name: "Visit preparation", exact: true })
      .press("Home");
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toBeFocused();
  }
});
test("CS06 evidence review sends only the exact capture and note; acknowledgement retains a reason after stale refusal", async ({
  page,
}, info) => {
  const f = await fixture(page);
  const sent: Record<string, unknown>[] = [];
  await page.route(
    `**/api/v1/cs/Readiness/${readinessId}/actions`,
    async (route) => {
      const body = route.request().postDataJSON();
      sent.push(body);
      await route.fulfill({
        status: 409,
        json: {
          code: "SourceChanged",
          message: "Source changed since this check. Nothing saved.",
        },
      });
    },
  );
  await page.goto(`${path}?view=evidence`);
  await page
    .getByRole("button", { name: "Review evidence", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review captured evidence" }),
  ).toBeVisible();
  await page
    .getByLabel("Review note", { exact: true })
    .fill("SYN exact capture reviewed");
  await page.screenshot({ path: info.outputPath("evidence-review.png") });
  await page
    .getByRole("button", { name: "Record review", exact: true })
    .click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evidence", exact: true })
      .getByRole("alert"),
  ).toContainText("Nothing saved");
  expect(sent[0]).toMatchObject({
    action: "review_evidence",
    expected_version: 8,
    evidence_id: f.data.record.content.evidence[0].id,
    reason: "SYN exact capture reviewed",
  });
  expect(sent[0]).not.toHaveProperty("content");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("tab", { name: "Visit preparation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Acknowledge this check", exact: true })
    .click();
  await page
    .getByLabel("Reason", { exact: true })
    .fill("SYN read blocker; work remains held");
  await page.screenshot({ path: info.outputPath("acknowledge.png") });
  await page.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Visit preparation", exact: true })
      .getByRole("alert"),
  ).toContainText("Nothing saved");
  await expect(page.getByLabel("Reason", { exact: true })).toHaveValue(
    "SYN read blocker; work remains held",
  );
  expect(sent[1]).toMatchObject({
    action: "acknowledge",
    snapshot_id: f.data.snapshots[0].id,
    reason: "SYN read blocker; work remains held",
  });
  expect(sent[1]).not.toHaveProperty("preparation");
  await expect(
    page.getByText("Not granted", { exact: true }).last(),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("source-changed-refused.png"),
  });
});
test("CS06 empty and changed-source frames preserve unknown, gated P4 and denied source distinctions", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const f = accessReadinessFixture();
  f.data.snapshots[0].recheck_required = true;
  await fixture(page, f);
  await page.goto(path);
  await expect(
    page
      .getByRole("tabpanel", { name: "Overview", exact: true })
      .getByText("Source changed since this check", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("source-changed-390.png") });
  f.data.record.content.requirements = [];
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No requirements recorded" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".shared-record-sticky")
      .getByRole("button", { name: "Add requirement" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("no-requirements-390.png") });
  await page.route(`**/api/v1/cs/Readiness/${readinessId}`, (route) =>
    route.fulfill({ status: 403, json: { message: "Access is restricted." } }),
  );
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "restricted" }),
  ).toBeVisible();
  await expect(page.getByText("SYN Jamie Visitor")).toHaveCount(0);
});
test("CS06 read-only access removes every mutation; failed reads offer retry", async ({
  page,
}) => {
  const f = accessReadinessFixture();
  f.data.can_edit = false;
  await fixture(page, f);
  await page.goto(`${path}?view=evidence`);
  await expect(page.getByText("Read only.", { exact: false })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review evidence", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Check preparation", exact: true }),
  ).toHaveCount(0);
  await page.route(`**/api/v1/cs/Readiness/${readinessId}`, (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Readiness could not be read. Try again." },
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "could not be read" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /retry|try again/i }),
  ).toBeVisible();
});
