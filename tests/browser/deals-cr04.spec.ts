import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { installDealsDesign } from "../helpers/deals-accepted-browser";
import { dealsDesignRecords } from "../helpers/deals-accepted-fixture";
const origin =
  process.env.PPO_TEST_ORIGIN ??
  `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
test.describe.configure({ timeout: 180000 });
test.use({ actionTimeout: 30000 });
test.beforeEach(async ({ page }) => {
  const r = await page.request.post(origin + "/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  expect(r.status()).toBe(200);
});
test("CR-04 application geometry and compact List at matching viewports", async ({
  page,
}, info) => {
  await installDealsDesign(page);
  for (const [width, height] of [
    [1440, 960],
    [1024, 768],
    [390, 844],
    [320, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(origin + "/sales/opportunities?view=Grid");
    await expect(
      page.locator(
        width <= 780
          ? ".crm-phone-deal"
          : ".ppo-register-table tbody tr[data-opportunity-id]",
      ),
    ).toHaveCount(18, {timeout:30000});
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width <= 780) {
      await expect(page.locator(".crm-toolbar-accepted")).toBeHidden();
      expect(
        (await page.locator(".crm-phone-deal").first().boundingBox())!.height,
      ).toBe(136);
      await expect(page.locator(".crm-phone-add")).toBeVisible();
    } else {
      expect(
        (await page.locator(".crm-toolbar-accepted").boundingBox())!.height,
      ).toBe(54);
      expect(
        (await page
          .locator(".ppo-register-table tbody tr[data-opportunity-id]")
          .first()
          .boundingBox())!.height,
      ).toBe(40);
    }
    await page.screenshot({
      path: info.outputPath(`application-list-${width}.png`),
    });
    await page.goto(origin + "/sales/opportunities?view=Board");
    await expect(page.locator(".crm-card:visible")).toHaveCount(
      width <= 780 ? 4 : 18,
    );
    if (width === 1440) {
      expect(
        (await page.locator(".crm-stage-heading").first().boundingBox())!.width,
      ).toBeCloseTo(228, 0);
      expect(
        (await page.locator(".crm-card").first().boundingBox())!.width,
      ).toBeCloseTo(212, 0);
    }
    await page.screenshot({
      path: info.outputPath(`application-board-${width}.png`),
    });
  }
});
test("CR-04 chooser, selected CSV, sequential snapshots and changed permission/source recovery", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const state = await installDealsDesign(page);
  await page.goto(origin + "/sales/opportunities?view=Grid");
  await page
    .getByRole("button", { name: "Column settings", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Reference", exact: true }).check();
  await page.keyboard.press("Escape");
  const rows = page.locator(
    ".ppo-register-table tbody tr[data-opportunity-id]",
  );
  await rows.nth(0).getByRole("checkbox").check();
  await rows.nth(1).getByRole("checkbox").check();
  await expect(
    page.getByRole("dialog", { name: "2 deals selected" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-selection-1440.png"),
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export selected list" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("PPO-Deals-selected-list.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("Reference");
  expect(csv).toContain(dealsDesignRecords[0].title);
  expect(csv).not.toContain(dealsDesignRecords[2].title);
  await page.getByRole("button", { name: "Open in sequence" }).click();
  await expect(page.locator(".crm-deal-dialog")).toContainText("1 of 2");
  await page.getByRole("button", { name: "Next selected deal" }).click();
  await expect(page.locator(".crm-deal-dialog")).toContainText(
    dealsDesignRecords[1].title,
  );
  await page.getByRole("button", { name: "Close deal dialog" }).click();
  state.changed = true;
  await page.getByRole("button", { name: "Export selected list" }).click();
  await expect(
    page.getByText("The permitted result page changed.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".crm-selection-panel")).toHaveCount(0);
  state.denied = true;
  await page
    .getByRole("button", { name: "Refresh from start", exact: true })
    .click();
  await expect(page.locator(".ppo-register-table")).toHaveCount(0);
  await expect(page.locator(".crm-selection-panel")).toHaveCount(0);
  await expect(
    page.getByText("This identity cannot read deals.", { exact: true }),
  ).toBeVisible();
});
test("CR-04 filter URL, browser history, Add deal overlay and follow-through retry", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const state = await installDealsDesign(page);
  await page.goto(origin + "/sales/opportunities?view=Grid&q=Potting");
  await expect(
    page.locator(".ppo-register-table tbody tr[data-opportunity-id]"),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Add deal", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Deal title", {exact:true})).toBeVisible({timeout:30000});
  await page.screenshot({ path: info.outputPath("application-add-1440.png") });
  expect(new URL(page.url()).searchParams.get("q")).toBe("Potting");
  await page.goBack();
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toHaveCount(0);
  await page.goForward();
  await expect(
    page.getByRole("dialog", { name: "Add deal", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  state.followFailed = true;
  await page
    .getByRole("button", { name: "Snapshot: Potting machine and take-off" })
    .click();
  await expect(
    page.getByText("Follow-through could not be read.", { exact: true }),
  ).toBeVisible();
  state.followFailed = false;
  await page.getByRole("button", { name: "Retry follow-through" }).click();
  await expect(
    page.getByText("No issued quotation available in this window.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("application-snapshot-1440.png"),
  });
  await expect(
    page.getByRole("link", { name: "Open full deal" }),
  ).toHaveAttribute("href", /return_to=.*view%3DGrid.*q%3DPotting/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Forecast", exact: true }).click();
  await page.reload();
  await expect(page.locator(".crm-forecast-card")).toHaveCount(2);
  expect(new URL(page.url()).searchParams.get("q")).toBe("Potting");
});

test("CR-04 month and outcome grouping, partial/failed/empty reads and compact selection", async ({page},info)=>{
 const state=await installDealsDesign(page);
 for(const width of [1440,1024,390,320]) {
  await page.setViewportSize({width,height:width===1024?768:width>1024?960:844});
  await page.goto(origin+"/sales/opportunities?view=Forecast");
  await expect(page.locator(".crm-forecast-card")).toHaveCount(18,{timeout:30000});
  await expect(page.locator(".crm-forecast")).toContainText("Not estimated");
  await page.screenshot({path:info.outputPath(`application-forecast-${width}.png`)});
  await page.goto(origin+"/sales/opportunities?view=Archive");
  await expect(page.locator("[data-opportunity-id]")).toHaveCount(6,{timeout:30000});
  await expect(page.locator(".crm-outcome-band")).toHaveCount(2);
  await expect(page.locator(".crm-outcome-band").first()).toContainText("$82,550.00");
  await expect(page.locator(".crm-outcome-band").last()).toContainText("1 not estimated");
  await page.screenshot({path:info.outputPath(`application-archive-${width}.png`)});
 }
 await page.goto(origin+"/sales/opportunities?view=Grid");
 await page.getByRole("button",{name:/^Choose view\. Current view:/}).click();
 await page.getByRole("button",{name:"Select deals",exact:true}).click();
 await page.locator(".crm-phone-select input").first().check();
 await expect(page.locator(".crm-selection-panel")).toBeVisible();
 await page.screenshot({path:info.outputPath("application-selection-320.png")});
 await page.getByRole("button",{name:"Close selection"}).click();
 await page.getByRole("button",{name:/^Search and filter/}).click();
 await expect(page.getByRole("dialog",{name:"Filter deals",exact:true})).toBeVisible();
 await page.screenshot({path:info.outputPath("application-filters-320.png")});
 await page.getByLabel("Search deals",{exact:true}).fill("no-synthetic-match");
 await page.getByRole("button",{name:"Close Filter deals",exact:true}).click();
 await expect(page.getByRole("heading",{name:"No deals match these filters"})).toBeVisible();
 state.empty=true; await page.goto(origin+"/sales/opportunities?view=Grid");
 await expect(page.getByRole("heading",{name:"No deals yet"})).toBeVisible();
 state.empty=false; state.partial=true;
 await page.setViewportSize({width:1440,height:960}); await page.reload();
 await expect(page.locator("[data-opportunity-id]")).toHaveCount(3);
 await expect(page.locator(".crm-workspace-status")).toContainText("this page");
 await page.screenshot({path:info.outputPath("application-partial-1440.png")});
 state.failed=true; await page.getByRole("button",{name:"Refresh from start",exact:true}).click();
 await expect(page.getByText("Synthetic read unavailable. Try again.",{exact:true})).toBeVisible();
 await expect(page.locator("[data-opportunity-id]")).toHaveCount(0);
 state.failed=false; await page.getByRole("button",{name:"Try loading again",exact:true}).click();
 await expect(page.locator("[data-opportunity-id]")).toHaveCount(3);
});
