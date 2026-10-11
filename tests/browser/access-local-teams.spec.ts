import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { browserFixtureCall } from "../helpers/browser-fixture-call";
const actor = "30000000-0000-4000-8000-000000000003",
  member = "30000000-0000-4000-8000-000000000005";
const command = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  team_id: randomUUID(),
  expected_version: 0,
  name: `SYN saved team ${randomUUID().slice(0, 8)}`,
  purpose: "A synthetic initial roster for native inspection.",
  reason: "Record the explicit local roster without granting access.",
  lead_id: actor,
  member_ids: [member],
});
test("AD01 saved teams: real creation, lost response, reload recovery and native roster", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.goto("/admin/access/roles");
  const input = command();
  let receipt: unknown;
  await page.route("**/api/v1/admin/access/teams", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    receipt = await response.json();
    await route.abort("failed");
  });
  await page.evaluate(async (input) => {
    await fetch("/api/v1/admin/access/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).catch(() => null);
  }, input);
  await page.unroute("**/api/v1/admin/access/teams");
  await page.reload();
  const recovered = await browserFixtureCall(
    page,
    `admin/access/teams/operations/${input.operation_id}`,
    undefined,
    baseURL!,
  );
  expect(recovered).toEqual(receipt);
  const retry = await page.request.post("/api/v1/admin/access/teams", {
    headers: { Origin: baseURL! },
    data: { ...input, member_ids: [member] },
  });
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toEqual(receipt);
  const saved = page.getByRole("article", { name: `${input.name} saved team` });
  await expect(saved).toBeVisible();
  await expect(saved).toContainText(input.team_id);
  await expect(saved).toContainText("1 person in the initial roster");
  const inspect = saved.getByRole("button", {
    name: `Inspect roster for ${input.name}`,
  });
  await inspect.focus();
  await page.keyboard.press("Enter");
  await expect(
    saved.getByRole("heading", { name: "Initial roster" }),
  ).toBeVisible();
  await expect(
    saved.getByRole("button", { name: `Close roster for ${input.name}` }),
  ).toBeFocused();
  await expect(saved).toContainText(member);
  await expect(saved).toContainText(input.operation_id);
  await expect(saved).toContainText(input.reason);
  await expect(
    page.getByRole("heading", { name: "Proposed teams", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Saved local teams", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await saved
    .getByRole("button", { name: `Close roster for ${input.name}` })
    .click();
  await expect(
    saved.getByRole("heading", { name: "Initial roster" }),
  ).toHaveCount(0);
});
test("AD01 saved teams: unavailable refresh hides saved data; denied detail clears whole catalogue", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  const input = command();
  await browserFixtureCall(page, "admin/access/teams", input, baseURL!);
  await page.goto("/admin/access/roles");
  const saved = page.getByRole("article", { name: `${input.name} saved team` });
  await expect(saved).toBeVisible();
  await page.route("**/api/v1/admin/access/teams?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "Synthetic team service unavailable",
      }),
    }),
  );
  await page.getByRole("button", { name: "Refresh saved teams" }).click();
  await expect(saved).toHaveCount(0);
  await expect(
    page.getByText("Synthetic team service unavailable"),
  ).toBeVisible();
  await page.unroute("**/api/v1/admin/access/teams?**");
  await page.getByRole("button", { name: "Retry loading", exact: true }).click();
  await expect(saved).toBeVisible();
  await page.route(`**/api/v1/admin/access/teams/${input.team_id}`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Forbidden",
        message: "Synthetic inspection authority removed",
      }),
    }),
  );
  await saved
    .getByRole("button", { name: `Inspect roster for ${input.name}` })
    .click();
  await expect(
    page.getByText("Synthetic inspection authority removed"),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Role proposals" }),
  ).toHaveCount(0);
  await expect(page.locator("#proposed-teams")).toHaveCount(0);
  await expect(saved).toHaveCount(0);
});
test("AD01 saved teams: real HTTP authority, origin, strict input and private response boundaries", async ({
  page,
  baseURL,
}) => {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  const input = command();
  const wrong = await page.request.post("/api/v1/admin/access/teams", {
    headers: { Origin: "https://invalid.example" },
    data: input,
  });
  expect(wrong.status()).toBe(403);
  const invalid = await page.request.post("/api/v1/admin/access/teams", {
    headers: { Origin: baseURL! },
    data: { ...input, member_ids: [member, member] },
  });
  expect(invalid.status()).toBe(422);
  const list = await page.request.get("/api/v1/admin/access/teams");
  expect(list.headers()["cache-control"]).toContain("no-store");
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "scheduling-policy-reviewer" },
    baseURL!,
  );
  const denied = await page.request.post("/api/v1/admin/access/teams", {
    headers: { Origin: baseURL! },
    data: input,
  });
  expect(denied.status()).toBe(403);
  expect((await page.request.get("/api/v1/admin/access/teams")).status()).toBe(
    200,
  );
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "site-observer" },
    baseURL!,
  );
  expect((await page.request.get("/api/v1/admin/access/teams")).status()).toBe(
    403,
  );
});
