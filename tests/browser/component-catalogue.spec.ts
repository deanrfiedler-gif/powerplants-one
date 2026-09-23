import { test, expect } from "@playwright/test";
import { readComponentManifest } from "../../src/development/component-catalog";
test.describe.configure({ timeout: 120000 });
test("catalogue filters, permanent links, references and consuming pages", async ({
  page,
}) => {
  await page.goto(
    "/development/design-system?component=gantt&state=undated&width=390",
  );
  await expect(
    page.getByRole("heading", { name: "Component catalogue", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Example state", exact: true }),
  ).toHaveValue("undated");
  await expect(
    page.getByRole("combobox", { name: "Viewport width", exact: true }),
  ).toHaveValue("390");
  await expect(
    page
      .frameLocator(
        'iframe[title="Project Gantt and list undated application example"]',
      )
      .getByText("Synthetic component example", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Find a component").fill("zz-unmatched");
  await expect(
    page.getByText("No components match.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Used on", exact: true }).click();
  await expect(
    page.getByText("Open page, links and design references").first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Differences", exact: true }).click();
  await expect(
    page.getByText("--surface-hover", { exact: true }),
  ).toBeVisible();
});
test("every registered state mounts without runtime errors or business writes", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [],
    writes: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/") && !["GET", "HEAD"].includes(r.method()))
      writes.push(r.url());
  });
  const manifest = await readComponentManifest(process.cwd());
  for (const entry of manifest.entries.filter((e) => e.example))
    for (const state of entry.states) {
      await page.goto(
        `/development/component-preview?component=${entry.id}&state=${state.id}`,
      );
      await expect(
        page.getByText("Synthetic component example", { exact: false }),
      ).toBeVisible();
      await expect(page.locator(".catalogue-preview")).not.toBeEmpty();
    }
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
  // The root loading boundary streams before an asynchronous notFound result.
  // Assert the rendered refusal rather than depending on transport status.
  for (const query of ["component=missing", "component=fields&state=missing"]) {
    await page.goto(`/development/component-preview?${query}`);
    await expect(
      page.getByRole("heading", { name: "This page is unavailable" }),
    ).toBeVisible();
    await expect(page.locator(".catalogue-preview")).toHaveCount(0);
  }
});
test("real form error targeting and modal focus restoration", async ({
  page,
}) => {
  await page.goto(
    "/development/component-preview?component=validation&state=default",
  );
  await page.getByRole("button", { name: "Save example", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Review the required fields." }),
  ).toBeFocused();
  await page.getByRole("link", { name: /Enter a title before saving/ }).click();
  await expect(page.getByLabel("Record title", { exact: true })).toBeFocused();
  await page
    .getByLabel("Record title", { exact: true })
    .fill("Synthetic title");
  await page.getByRole("button", { name: "Save example", exact: true }).click();
  await expect(
    page.getByText("Saved in this preview only.", { exact: false }),
  ).toBeVisible();
  await page.goto(
    "/development/component-preview?component=dialog&state=default",
  );
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open dialog", exact: true }),
  ).toBeFocused();
});

test("phone board retains a selected stage and usable cards", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/development/component-preview?component=sales-board&state=default",
  );
  await expect(
    page.getByRole("link", {
      name: "Climate upgrade — synthetic example",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Board stage on smaller screens",
      exact: true,
    })
    .click();
  await page
    .getByRole("menuitemradio", { name: "Scoping", exact: true })
    .click();
  await expect(
    page.getByRole("link", {
      name: "Propagation irrigation — long customer requirement for review",
      exact: true,
    }),
  ).toBeVisible();
});
