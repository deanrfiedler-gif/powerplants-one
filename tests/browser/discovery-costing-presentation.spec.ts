import { test, expect, type Page } from "@playwright/test";
import {
  costingFixture,
  costingId,
  mountCosting,
} from "../helpers/discovery-costing-presentation";

test.describe.configure({ timeout: 120000 });
test.use({ actionTimeout: 15000 });
const review = (page: Page) =>
  page.getByRole("button", { name: /^Review and adopt/ });
async function ready(page: Page) {
  await expect(review(page)).toBeEnabled({ timeout: 90000 });
}
async function openReview(page: Page) {
  await ready(page);
  await review(page).click();
  const modal = page.getByRole("dialog", { name: /Adopt discovery/ });
  await modal
    .getByLabel("Reason for adopting this cost basis")
    .fill("SYN reviewed exact saved scope and manual costs.");
  await modal.getByRole("checkbox").check();
  return modal;
}
test("manual edit compares saved lines, keeps provenance and submits native adoption fields", async ({
  page,
}, info) => {
  const fixture = await mountCosting(page);
  await ready(page);
  await page
    .getByRole("button", {
      name: "Edit Shade screen motor and gearbox",
      exact: true,
    })
    .filter({ visible: true })
    .click();
  const editor = page.getByRole("dialog", { name: "Edit cost line 1" });
  await expect(
    editor.getByRole("link", { name: /SYN supplier/ }),
  ).toHaveAttribute("href", new RegExp(`${costingId(60)}.*${costingId(61)}`));
  await editor.getByLabel("Quantity", { exact: true }).fill("6");
  await editor.getByRole("button", { name: "Keep line in proposal" }).click();
  await expect(page.locator(".dc-bottom")).toContainText("1 lines changed");
  await expect(page.locator(".dc-summary")).toContainText("+4,900.00");
  await page.screenshot({ path: info.outputPath("proposal.png") });
  const modal = await openReview(page);
  await page.screenshot({ path: info.outputPath("review.png") });
  await modal.getByRole("button", { name: /^Adopt r02/ }).click();
  await expect.poll(() => fixture.adoptions.length).toBe(1);
  const body = fixture.adoptions[0];
  expect(body).toMatchObject({
    revision_id: costingId(12),
    expected_estimate_version: 2,
    expected_workspace_version: 2,
    policy: "SYN-EST-ARITHMETIC-01",
  });
  expect(
    (body.lines as { quantity: string; source: string }[])[0],
  ).toMatchObject({ quantity: "6", source: "SYN supplier quote SQ-108" });
  expect(body.operation_id).toBeTruthy();
});
for (const width of [1440, 1024, 390, 320])
  test(`layout and keyboard at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({
      width,
      height: width === 1024 ? 768 : width >= 1200 ? 1000 : 844,
    });
    await mountCosting(page);
    await ready(page);
    await expect(page.locator("#ppo-estimate-wizard")).toHaveAttribute("data-module-layout", "full-bleed");
    const icon = await page.locator(".dc-basis-banner > .dc-banner > .es02-icon").boundingBox();
    expect(icon?.width).toBeLessThanOrEqual(20);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 780) {
      await expect(page.locator(".dc-phone-lines")).toBeVisible();
      await expect(page.locator(".dc-grid")).toBeHidden();
    }
    if (width < 1200) await expect(page.locator(".dc-summary")).toBeHidden();
    await page.screenshot({
      path: info.outputPath(`costing-${width}.png`),
      fullPage: true,
    });
    const opener = page
      .getByRole("button", {
        name: "Edit Shade screen motor and gearbox",
        exact: true,
      })
      .filter({ visible: true });
    await opener.focus();
    await page.keyboard.press("Enter");
    const editor = page.getByRole("dialog", { name: "Edit cost line 1" });
    await expect(editor).toBeVisible();
    if (width < 780) expect((await editor.boundingBox())?.width).toBe(width);
    await editor.getByLabel("Unit sell AUD", { exact: true }).fill("1.00");
    await editor.getByRole("button", { name: "Keep line in proposal" }).click();
    await expect(editor).toBeVisible();
    await page.screenshot({ path: info.outputPath(`validation-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(editor).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
test("new discovery keeps proposal and blocks adoption until explicit fresh comparison", async ({
  page,
}, info) => {
  const f = await mountCosting(page);
  await ready(page);
  await page
    .getByLabel("Included scope", { exact: true })
    .fill("SYN kept proposal wording");
  f.detail.workspace.version = 3;
  f.detail.options[0].revision = {
    ...f.current,
    id: costingId(13),
    version: 3,
  };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByText(
      "Discovery or the saved estimate changed while you were costing.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(review(page)).toHaveCount(0);
  await expect(page.getByLabel("Included scope", { exact: true })).toHaveValue(
    "SYN kept proposal wording",
  );
  await page.screenshot({ path: info.outputPath("stale.png") });
  expect(f.adoptions).toHaveLength(0);
});
test("adopting freezes confirmation; uncertain checks original operation without a new save", async ({
  page,
}, info) => {
  const f = costingFixture();
  f.mode = "pending";
  await mountCosting(page, f);
  const modal = await openReview(page);
  await modal.getByRole("button", { name: /^Adopt r02/ }).click();
  await expect(
    modal.getByRole("button", { name: "Adopting…", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(modal).toBeVisible();
  await page.screenshot({ path: info.outputPath("adopting.png") });
  f.mode = "uncertain";
  f.release?.();
  const unknown = page.getByRole("dialog", {
    name: "Adoption outcome not confirmed",
  });
  await expect(unknown).toBeVisible();
  await page.screenshot({ path: info.outputPath("uncertain.png") });
  await unknown
    .getByRole("button", { name: "Check the save outcome", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/estimating/estimates/${costingId(4)}`),
    {timeout:90000},
  );
  expect(f.adoptions).toHaveLength(1);
});
test("incomplete, retained manual, permission and source failure states", async ({
  page,
}, info) => {
  for (const state of ["incomplete", "legacy", "denied", "error"] as const) {
    const f = costingFixture();
    if (state === "incomplete")
      f.detail.options[0].revision.scope_readiness = "Incomplete";
    if (state === "legacy") {
      f.summary.basis_kind = "LegacyManual";
      f.detail.options[0].revision.kind = "LegacyManual" as "Discovery";
    }
    if (state === "denied") f.detail.can_edit = false;
    if (state === "error") f.mode = "error";
    await mountCosting(page, f);
    await expect(
      page.getByText(
        state === "incomplete"
          ? "What is not ready"
          : state === "legacy"
            ? "This option keeps its original estimate"
            : state === "denied"
              ? "You can no longer adopt this cost basis"
              : "Saved source could not be loaded.",
        { exact: true },
      ),
    ).toBeVisible();
    await page.screenshot({ path: info.outputPath(`${state}.png`) });
    expect(f.adoptions).toHaveLength(0);
    await page.unroute("**/api/v1/**");
  }
});
test("loading and revoked source never imply zero totals or retain protected costs", async ({
  page,
}, info) => {
  const f = costingFixture();
  f.mode = "loading";
  await mountCosting(page, f);
  await expect(page.getByRole("status")).toContainText(
    "Loading the saved scope",
  );
  await page.screenshot({ path: info.outputPath("loading.png") });
  f.mode = "normal";
  f.release?.();
  await ready(page);
  f.summary.status = "Unavailable";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Costing is no longer available" }),
  ).toBeVisible();
  await expect(
    page.getByText("SYN supplier quote SQ-108", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".dc-totals")).toHaveCount(0);
});
