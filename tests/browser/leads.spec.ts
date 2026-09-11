import { test, expect, type Page } from "@playwright/test";
import { CRM, crmBase, crmAction } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";
test.describe.configure({ timeout: 120000 });
test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => console.error("Leads browser error:", error.message));
  page.on("console", message => { if (message.type() === "error") console.error("Leads console:", message.text()); });
});
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
test("approved leads list/detail and atomic conversion persist through reload", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = leadCreate();
  await call(page, "crm/leads", input);
  const action = crmAction();
  await call(page, `crm/leads/${input.id}/next-action`, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: action,
  });
  await page.goto(`/crm/leads?q=${encodeURIComponent(input.title)}`);
  await expect(
    page.locator(`a[href*="/crm/leads/${input.id}"]:visible`).first(),
  ).toBeVisible();
  if (info.project.use.isMobile) {
    await expect(
      page.getByRole("link", { name: "Back to deals" }),
    ).toBeVisible();
    await expect(page.locator(".mobile-navigation")).not.toBeVisible();
    await expect(page.locator(".topbar.ppo-shell-header")).not.toBeVisible();
  }
  await page.screenshot({ path: info.outputPath("leads-list.png") });
  await page
    .locator(`a[href*="/crm/leads/${input.id}"]:visible`)
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(input.title);
  await page.screenshot({ path: info.outputPath("lead-detail.png") });
  await page
    .getByRole("button", { name: "Convert to deal", exact: true })
    .click();
  await page
    .getByLabel("Qualification note", { exact: true })
    .fill("SYN Credible requirement confirmed; proceed with owned follow-up.");
  await page
    .getByRole("button", { name: "Convert to deal", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Converted");
  await page.reload();
  const lead = await call(page, `crm/leads/${input.id}`);
  expect(lead.status).toBe("Converted");
  expect(lead.deal.id).toBeTruthy();
  expect(lead.next_activity.id).toBe(action.id);
  await page.getByRole("link", { name: "Open deal", exact: true }).click();
  await expect(
    page.getByRole("link", { name: lead.display_number, exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("converted-deal.png") });
});
test("Add lead has one scroll body, fixed actions, focus return and navy add button at phone sizes", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  await page.goto("/crm/leads");
  await expect(
    page.getByRole("button", { name: "Add lead", exact: true }),
  ).toBeVisible();
  for (const viewport of info.project.use.isMobile
    ? [
        { width: 390, height: 844 },
        { width: 320, height: 800 },
        { width: 390, height: 440 },
      ]
    : [{ width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const add = page.getByRole("button", { name: "Add lead", exact: true });
    await add.click();
    const modal = page.getByRole("dialog", { name: "Add lead", exact: true });
    await expect(modal).toBeVisible();
    await page
      .getByLabel("Lead title", { exact: true })
      .fill("SYN Mobile manual enquiry");
    await page
      .getByLabel("Requirement / enquiry", { exact: true })
      .fill(
        "SYN Long requirement line for scrolling verification.\n".repeat(24),
      );
    const before = await modal.locator(".lead-dialog-foot").boundingBox();
    await modal.locator(".lead-dialog-body").evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    });
    const after = await modal.locator(".lead-dialog-foot").boundingBox();
    expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
    await expect(
      page.getByRole("button", { name: "Save lead", exact: true }),
    ).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("hidden");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .getByLabel("Requirement / enquiry", { exact: true })
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 2),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(
        `add-lead-${viewport.width}x${viewport.height}.png`,
      ),
    });
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(modal).not.toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).not.toBe("hidden");
    await expect(add).toBeFocused();
  }
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("manual lead saves with an unverified organisation and survives reload", async ({
  page,
}) => {
  await call(page, "local-session", { profile: "coordinator" });
  await page.goto("/crm/leads");
  await page.getByRole("button", { name: "Add lead", exact: true }).click();
  await page
    .getByLabel("Lead title", { exact: true })
    .fill("SYN Unverified inbox enquiry");
  const company = page.getByRole("combobox", { name: "Company", exact: true });
  await company.fill("SYN");
  await page.locator(`[role=option][data-record-id="${CRM.company}"]`).click();
  const owner = page.getByRole("combobox", { name: "Lead owner", exact: true });
  await owner.fill("SYN");
  await page.locator(`[role=option][data-record-id="${CRM.owner}"]`).click();
  await page
    .getByLabel("Organisation / business", { exact: true })
    .fill("SYN Unverified Nursery");
  await page
    .getByLabel("Source details", { exact: true })
    .fill("SYN Manual phone enquiry; contact to be confirmed.");
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "SYN Unverified Nursery",
  );
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText(
    "SYN Unverified Nursery",
  );
});

test("approved desktop columns resize independently and retain widths with quiet aligned handles", async ({
  page,
}, info) => {
  test.skip(
    !!info.project.use.isMobile,
    "Desktop column interaction; phone journey covered separately.",
  );
  await call(page, "local-session", { profile: "coordinator" });
  const input = leadCreate();
  await call(page, "crm/leads", input);
  await page.goto(`/crm/leads?q=${encodeURIComponent(input.title)}`);
  await expect(page.locator(".lead-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".lead-add")).toHaveText("Lead");
  await page.getByRole("button", { name: "Reset columns" }).click();
  const widths = () =>
    page
      .locator(".lead-table col")
      .evaluateAll((cs) => cs.map((c) => c.getBoundingClientRect().width));
  const handle = page.getByRole("separator", {
    name: "Resize Lead title column",
    exact: true,
  });
  const before = await widths();
  expect(
    await handle.evaluate((h) => getComputedStyle(h, "::after").opacity),
  ).toBe("0");
  await handle.hover();
  expect(
    await handle.evaluate((h) => getComputedStyle(h, "::after").opacity),
  ).toBe("1");
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 125, box.y + 15);
  await page.mouse.up();
  const after = await widths();
  expect(after[0] - before[0]).toBeCloseTo(120, 0);
  expect(after.slice(1)).toEqual(before.slice(1));
  for (const offset of await page
    .locator(".lead-table th")
    .evaluateAll((ths) =>
      ths.map(
        (th) =>
          th.querySelector(".lead-column-resizer")!.getBoundingClientRect()
            .right -
          (th.getBoundingClientRect().right - 0.5),
      ),
    ))
    expect(Math.abs(offset)).toBeLessThan(0.1);
  await page.reload();
  await expect(page.locator(".lead-table tbody tr")).toHaveCount(1);
  await expect.poll(widths).toEqual(after);
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  expect((await widths())[0]).toBeCloseTo(after[0] - 10, 0);
  await page.keyboard.press("Home");
  expect((await widths())[0]).toBe(190);
  await page.getByRole("button", { name: "Reset columns" }).click();
  await expect.poll(widths).toEqual(before);
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 960, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".ppo-shell-header")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`leads-desktop-${viewport.width}.png`),
    });
  }
  await page.getByRole("button", { name: "Quick add", exact: true }).click();
  await page.getByRole("link", { name: "Lead In this module", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Add lead", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
