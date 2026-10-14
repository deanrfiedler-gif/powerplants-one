import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const fixtureCommand = (...args: string[]) =>
  execFileSync(
    process.execPath,
    [
      "--env-file-if-exists=.env.local",
      "--import",
      "tsx",
      "scripts/es02-fixture.ts",
      ...args,
    ],
    { stdio: "pipe" },
  );
test.afterEach(() => {
  fixtureCommand("restore-owner");
});

test("ES02 Figma: explicit catalogue review preserves original revisions and prices; phone editor shares the draft", async ({
  page,
  context,
}, info) => {
  test.setTimeout(120000);
  fixtureCommand();
  const fixture = JSON.parse(await readFile("tmp/es02-fixture.json", "utf8"));
  const origin = info.project.use.baseURL!;
  await context.request.post(origin + "/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  const endpoint =
    origin + "/api/v1/estimating/workspaces/" + fixture.workspace_id;
  const original = await (await context.request.get(endpoint)).json();
  await page.goto(fixture.route);
  await page
    .getByRole("button", { name: "Use six-family catalogue", exact: true })
    .click();
  const review = page.getByRole("dialog", {
    name: "Use six-family catalogue",
    exact: true,
  });
  await expect(
    review.getByRole("button", { name: "Apply to working copy" }),
  ).toBeDisabled();
  for (const [name, family, category] of [
    ["Climate control", "Controls", "controls-priva-compass"],
    ["Crop monitoring", "Controls", "controls-sensors-weather-stations"],
    ["Fertigation", "Water", "water-priva-nutrifit"],
    ["Shared network", "Infrastructure", ""],
  ]) {
    await review
      .getByLabel("Family for " + name, { exact: true })
      .selectOption(family);
    if (category)
      await review
        .getByLabel("Category for " + name, { exact: true })
        .selectOption(category);
  }
  await review.getByRole("button", { name: "Apply to working copy" }).click();
  await expect(review).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Controls 2 systems", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Working copy of r03 .* unsaved change/ })
    .click();
  const changes = page.getByRole("region", {
    name: "Unsaved changes",
    exact: true,
  });
  await expect(changes).toContainText("Configuration catalogue");
  await changes.getByRole("button", { name: /Climate control/ }).click();
  await expect(page.getByLabel("System name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Category", { exact: true })).toHaveValue(
    "controls-priva-compass",
  );
  await page
    .getByLabel("Proposed work", { exact: true })
    .fill("SYN reviewed controller expansion");
  if (info.project.name === "mobile-chromium") {
    await expect(page.locator(".es02-system-editor")).toBeVisible();
    await expect(page.locator(".mobile-navigation")).toBeHidden();
    await page
      .getByRole("button", { name: "Back to systems", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Climate control", exact: true }),
    ).toBeFocused();
    await page
      .getByRole("button", { name: "Climate control", exact: true })
      .click();
    await expect(page.getByLabel("Proposed work", { exact: true })).toHaveValue(
      "SYN reviewed controller expansion",
    );
    await page
      .getByRole("button", { name: "Back to systems", exact: true })
      .click();
  }
  // Applying classifications and editing are local: no saved option changed.
  expect(await (await context.request.get(endpoint)).json()).toEqual(original);
  await page
    .getByRole("button", { name: "Save discovery revision", exact: true })
    .click();
  const save = page.getByRole("dialog", {
    name: "Save discovery revision",
    exact: true,
  });
  await save
    .getByLabel("Discovery change reason", { exact: true })
    .fill("Synthetic explicit catalogue review");
  for (const box of await save.getByRole("checkbox").all()) await box.check();
  await save
    .getByRole("button", {
      name: "Confirm save discovery revision",
      exact: true,
    })
    .click();
  await expect(save).toHaveCount(0);
  await expect(
    page.getByRole("tab", { name: "Revisions 4", exact: true }),
  ).toBeVisible();
  const saved = await (await context.request.get(endpoint)).json();
  const previous = original.options.find(
    (o: { option: { id: string } }) => o.option.id === fixture.option_id,
  ).revision;
  const current = saved.options.find(
    (o: { option: { id: string } }) => o.option.id === fixture.option_id,
  ).revision;
  expect(current.id).not.toBe(previous.id);
  expect(current.input.configuration.definition_id).toBe("PPO-ES02-CONFIG-r02");
  expect(
    current.input.configuration.systems.map((s: { id: string }) => s.id),
  ).toEqual(
    previous.input.configuration.systems.map((s: { id: string }) => s.id),
  );
  expect(current.input.configuration.facts).toEqual(
    previous.input.configuration.facts,
  );
  await page.reload();
  if (info.project.name === "mobile-chromium")
    await page
      .locator(".es02-bottom")
      .getByRole("button", { name: "Summary", exact: true })
      .click();
  const summary = page.getByRole("complementary", {
    name: "Estimate summary",
    exact: true,
  });
  await expect(summary).toContainText("AUD 58,400.00");
  await expect(summary).toContainText("Discovery r02");
  await page.screenshot({ path: info.outputPath("es02-catalogue-saved.png") });
});

test("ES02 Figma: six family states, category addition and confirmed discard", async ({
  page,
  context,
}, info) => {
  fixtureCommand("r02");
  const fixture = JSON.parse(await readFile("tmp/es02-fixture.json", "utf8"));
  const origin = info.project.use.baseURL!;
  await context.request.post(origin + "/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile: "coordinator" },
  });
  await page.goto(fixture.route);
  await expect(
    page.locator('.es02-configuration .es02-family[data-state="confirmed"]'),
  ).toContainText("Water");
  await expect(
    page.locator('.es02-configuration .es02-family[data-state="pending"]'),
  ).toContainText("Controls");
  await expect(
    page.locator('.es02-configuration .es02-family[data-state="empty"]'),
  ).toHaveCount(4);
  await page.locator(".es02-add-menu > summary").click();
  await page
    .getByLabel("System family", { exact: true })
    .selectOption("Climate");
  const category = page.locator(".es02-category-list button").first();
  const chosen = await category.innerText();
  await category.click();
  await expect(
    page.getByLabel("Category", { exact: true }).locator("option:checked"),
  ).toHaveText(chosen);
  await page
    .getByLabel("System name", { exact: true })
    .fill("SYN category addition");
  if (info.project.name === "mobile-chromium")
    await page
      .getByRole("button", { name: "Back to systems", exact: true })
      .click();
  await page
    .getByRole("button", { name: /Working copy of r03 .* unsaved change/ })
    .click();
  const changes = page.getByRole("region", {
    name: "Unsaved changes",
    exact: true,
  });
  await expect(changes).toContainText("SYN category addition");
  await changes
    .getByRole("button", { name: "Discard changes…", exact: true })
    .click();
  const discard = page.getByRole("dialog", {
    name: "Unsaved discovery",
    exact: true,
  });
  await expect(discard).toBeVisible();
  await discard
    .getByRole("button", {
      name: "Discard working changes then continue",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "SYN category addition", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Working copy of r03/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("es02-configuration.png") });
});
