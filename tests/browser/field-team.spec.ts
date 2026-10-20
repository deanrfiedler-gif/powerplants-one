import { test, expect, type Page } from "@playwright/test";
import { destinations } from "../../src/shell/navigation";
import {
  teamDay,
  teamFixture,
  teamId,
  teamWorkspace,
  teamZone,
} from "../helpers/field-team-fixture";

async function setup(page: Page) {
  await page.route("**/*fontawesome*", (r) => r.abort());
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({
      json: {
        items: [],
        next_cursor: null,
        observed_at: teamFixture().observed_at,
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: teamId(300),
        workspace_id: teamId(301),
        display_name: "SYN Service coordinator",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: "SYN Service coordinator",
        preference_scope: "pl02-fixture",
        actions: [],
        navigation: destinations.map((x) => x.id),
        can_preview: true,
      },
    }),
  );
  // Presentation proof with bounded synthetic reads; server access is covered separately.
  await page.route("**/api/v1/schedule?*", (route) =>
    route.fulfill({ json: teamFixture() }),
  );
  await page.route("**/api/v1/resources/*/scheduling?*", (route) => {
    const id = new URL(route.request().url()).pathname.split("/")[4];
    return route.fulfill({ json: teamWorkspace(id) });
  });
}
const register = `/service/technicians?day=${teamDay}&timezone=${teamZone}`;
const person = `/service/technicians/${teamId(1)}?day=${teamDay}&timezone=${teamZone}`;
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test("accepted Field team register, snapshot and person record reflow at all drawn widths", async ({
  page,
}, info) => {
  test.setTimeout(300000);
  await setup(page);
  const widths = info.project.name.includes("mobile")
    ? [390, 320]
    : [1440, 1024];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width > 780 ? 900 : 844 });
    await page.goto(register);
    const root = page.locator("#ppo-field-team");
    await expect(
      root.getByText("9 technicians", { exact: true }),
    ).toBeVisible();
    if (width === 1024) {
      const collapse = page.getByRole("button", {
        name: "Collapse primary navigation",
        exact: true,
      });
      if (await collapse.isVisible()) await collapse.click();
    }
    if (width <= 780)
      expect((await root.locator(".pl02-toolbar").boundingBox())!.height).toBe(
        110,
      );
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath(`register-${width}.png`),
      fullPage: true,
    });
    if (width > 780) {
      await root
        .getByRole("button", { name: "Casey Ward", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page
          .getByRole("dialog")
          .getByRole("link", { name: "View visits", exact: true }),
      ).toHaveAttribute("href", /resource_id=a4000000/);
      await page.screenshot({
        path: info.outputPath(`snapshot-${width}.png`),
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(
        root.getByRole("button", { name: "Casey Ward", exact: true }),
      ).toBeFocused();
      await page.goto(person);
    } else {
      await root
        .locator(".pl02-phone-list")
        .getByRole("link", { name: /Casey Ward/ })
        .click();
      await expect(page).toHaveURL(new RegExp(teamId(1)));
    }
    await expect(
      page.getByRole("heading", { name: "Seven-day availability" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /availability;.*hours booked/ }),
    ).toHaveCount(7);
    await expect(
      page.getByText("Tue, 13 Oct", { exact: false }).first(),
    ).toBeAttached();
    if (width <= 780)
      await expect(page.locator(".pl02-phone-heading h1")).toHaveText(
        "Casey Ward",
      );
    await noOverflow(page);
    if (width <= 780) {
      const refresh = page.getByRole("button", {
        name: "Refresh evidence",
        exact: true,
      });
      expect(
        (await refresh.boundingBox())!.x + (await refresh.boundingBox())!.width,
      ).toBeLessThanOrEqual(width - 16);
    }
    await page.setViewportSize({
      width,
      height: width > 780 ? 1705 : width === 390 ? 2664 : 2842,
    });
    await page.screenshot({
      path: info.outputPath(`record-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", {
        name: "Review evidence for SYN-VALVE",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Expires within selected period",
    );
    await expect(page.getByRole("dialog")).toContainText(teamId(300));
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath(`evidence-${width}.png`),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", {
        name: "Review evidence for SYN-VALVE",
        exact: true,
      }),
    ).toBeFocused();
    const link = page
      .getByRole("link", { name: "View visits", exact: true })
      .filter({ visible: true });
    await expect(link).toHaveAttribute("href", /view=visits&resource_id=/);
    await link.click();
    await expect(
      page.getByLabel("Technician", { exact: true }).filter({ visible: true }),
    ).toHaveValue(teamId(1));
    await expect(
      page.getByRole("table", {
        name: "Scheduled service visits",
        exact: true,
      }),
    ).toBeVisible();
  }
});

test("loading, failed, partial and denied reads remove prior rows and counts; no-match filters can be cleared", async ({
  page,
}, info) => {
  await setup(page);
  await page.goto(register);
  const root = page.locator("#ppo-field-team");
  await expect(root.getByText("9 technicians", { exact: true })).toBeVisible();
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/schedule?*", async (route) => {
    await held;
    await route.fulfill({
      status: 503,
      json: { message: "Synthetic read failure" },
    });
  });
  await root.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    root.getByText("Loading permitted records…", { exact: true }),
  ).toBeVisible();
  await expect(root.getByText("9 technicians", { exact: true })).toHaveCount(0);
  await expect(root.locator(".pl02-grid,.pl02-phone-list")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("loading.png"),
    fullPage: true,
  });
  release();
  await expect(root.getByRole("alert")).toContainText(
    "Technicians could not be loaded",
  );
  await page.screenshot({ path: info.outputPath("error.png"), fullPage: true });
  await page.route("**/api/v1/schedule?*", (route) =>
    route.fulfill({ json: { ...teamFixture(), completeness: "Incomplete" } }),
  );
  await root.getByRole("button", { name: "Retry loading" }).click();
  await expect(root).toContainText("The result is incomplete");
  await expect(root.locator(".pl02-grid,.pl02-phone-list")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("partial.png"),
    fullPage: true,
  });
  await page.route("**/api/v1/schedule?*", (route) =>
    route.fulfill({ status: 403, json: { message: "Forbidden" } }),
  );
  await root.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(root.getByRole("alert")).toContainText("outside your access");
  await expect(root.locator(".pl02-grid,.pl02-phone-list")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("denied.png"),
    fullPage: true,
  });
  await page.route("**/api/v1/schedule?*", (route) =>
    route.fulfill({ json: teamFixture() }),
  );
  await page.goto(register + "&search=no-matches&people=active");
  await expect(
    root.getByRole("heading", { name: "No matching results" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("no-matches.png"),
    fullPage: true,
  });
  await root
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(root.getByText("9 technicians", { exact: true })).toBeVisible();
});

test("anonymous reservations remain anonymous and a refresh invalidates an open evidence panel", async ({
  page,
}, info) => {
  await setup(page);
  const data = teamWorkspace();
  data.appointments = [];
  data.sites = [];
  await page.route("**/api/v1/resources/*/scheduling?*", (route) =>
    route.fulfill({ json: data }),
  );
  await page.goto(person);
  await expect(
    page.getByText("View only: visit details outside your access", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".pl02-band-busy").first()).toBeVisible();
  await expect(page.locator(".pl02-visit")).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("view-only.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Review evidence for SYN-VALVE" })
    .click();
  await page.keyboard.press("Escape");
  await page.route("**/api/v1/resources/*/scheduling?*", (route) =>
    route.fulfill({ status: 403, json: { message: "Forbidden" } }),
  );
  await page.getByRole("button", { name: "Refresh evidence" }).click();
  await expect(
    page.locator("#ppo-field-team-record").getByRole("alert"),
  ).toContainText("outside your access");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Seven-day availability" }),
  ).toHaveCount(0);
  await expect(page.locator(".pl02-evidence-bar")).toHaveCount(0);
});
