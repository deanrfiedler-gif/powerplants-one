import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { browserFixtureCall } from "../helpers/browser-fixture-call";

const base = "admin/access/teams",
  url = "/admin/access/roles";
const creator = "30000000-0000-4000-8000-000000000003",
  member = "30000000-0000-4000-8000-000000000005";
const key = `ppo-access-team:10000000-0000-4000-8000-000000000001:${creator}:create`;
const form = (page: Page) =>
  page.getByRole("region", { name: "Record a local team", exact: true });
const submit = (page: Page) =>
  form(page).getByRole("button", { name: "Record team", exact: true });
async function open(page: Page, origin: string, profile = "systems") {
  await browserFixtureCall(page, "local-session", { profile }, origin);
  await page.goto(url);
}
async function fill(page: Page) {
  const name = `SYN native team ${randomUUID().slice(0, 8)}`;
  await form(page).getByLabel("Team name", { exact: true }).fill(name);
  await form(page)
    .getByLabel("Team purpose", { exact: true })
    .fill("Inspect an explicitly selected synthetic initial roster.");
  await form(page)
    .getByLabel("Team lead", { exact: true })
    .selectOption(creator);
  await form(page)
    .getByLabel("Person to add to initial roster", { exact: true })
    .selectOption(member);
  await form(page).getByRole("button", { name: "Add selected person" }).click();
  await form(page)
    .getByLabel("Team creation reason", { exact: true })
    .fill("Record this local roster without changing anybody's access.");
  return name;
}
async function original(page: Page) {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), key);
}

test("AD01 native team creation: explicit roster, exact history and unchanged grants", async ({
  page,
  baseURL,
}) => {
  await open(page, baseURL!);
  const before = await browserFixtureCall(
    page,
    `admin/access/${member}`,
    undefined,
    baseURL!,
  );
  await expect(form(page).getByLabel("Team lead", { exact: true })).toHaveValue(
    "",
  );
  await expect(form(page)).toContainText("0 of 20 people selected");
  const name = await fill(page);
  await expect(
    form(page).getByText(`Selected lead ID: ${creator}`, { exact: true }),
  ).toBeVisible();
  await expect(
    form(page)
      .getByLabel("Person to add to initial roster")
      .locator(`option[value="${member}"]`),
  ).toHaveCount(0);
  await form(page)
    .getByRole("button", { name: /^Remove / })
    .click();
  await expect(form(page)).toContainText("0 of 20 people selected");
  await form(page)
    .getByLabel("Person to add to initial roster")
    .selectOption(member);
  await form(page).getByRole("button", { name: "Add selected person" }).click();
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/api/v1/${base}`) && r.request().method() === "POST",
  );
  await submit(page).click();
  const result = await response;
  expect(result.status()).toBe(201);
  const receipt = await result.json();
  await expect(form(page)).toContainText(
    "Local team recorded. No grants changed.",
  );
  await expect(submit(page)).toHaveCount(0);
  await expect(form(page)).toContainText(receipt.record_id);
  // The original can be older than the visible collection page. The detail is authoritative.
  await page.route(`**/api/v1/${base}?offset=*`, (route) =>
    route.fulfill({ json: { items: [], has_more: false } }),
  );
  await form(page).getByRole("button", { name: "Inspect saved team" }).click();
  const card = page.getByRole("article", { name: `${name} saved team` });
  await expect(card).toBeFocused();
  await expect(
    page.getByText("No local teams have been recorded.", { exact: true }),
  ).toHaveCount(0);
  await expect(
    card.getByRole("heading", { name: "Initial roster" }),
  ).toBeVisible();
  await expect(card).toContainText(receipt.operation_id);
  const detail = await browserFixtureCall(
    page,
    `${base}/${receipt.record_id}`,
    undefined,
    baseURL!,
  );
  expect(detail.members.map((p: { user_id: string }) => p.user_id)).toEqual([
    member,
  ]);
  expect(detail.team.lead_id).toBe(creator);
  expect(detail.history).toHaveLength(1);
  expect(
    (
      await browserFixtureCall(
        page,
        `admin/access/${member}`,
        undefined,
        baseURL!,
      )
    ).grants,
  ).toEqual(before.grants);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("AD01 native team creation: invalid roster is refused and entries survive correction", async ({
  page,
  baseURL,
}) => {
  await open(page, baseURL!);
  const name = await fill(page);
  await form(page)
    .getByRole("button", { name: /^Remove / })
    .click();
  await submit(page).click();
  await expect(
    form(page).getByLabel("Person to add to initial roster"),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(form(page).getByLabel("Team name", { exact: true })).toHaveValue(
    name,
  );
  await expect(submit(page)).toBeEnabled();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
  await form(page)
    .getByLabel("Person to add to initial roster")
    .selectOption(member);
  await form(page).getByRole("button", { name: "Add selected person" }).click();
  await submit(page).click();
  await expect(form(page)).toContainText("Local team recorded");
});

test("AD01 native team creation: lost committed response reloads the original with a minimal receipt pointer", async ({
  page,
  baseURL,
}) => {
  await open(page, baseURL!);
  await fill(page);
  let receipt: { record_id: string; operation_id: string } | undefined;
  let posts = 0;
  await page.route(`**/api/v1/${base}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    posts++;
    const response = await route.fetch();
    expect(response.status()).toBe(201);
    receipt = await response.json();
    await route.abort("failed");
  });
  await submit(page).click();
  await expect(
    form(page).getByRole("button", { name: "Retry unchanged action" }),
  ).toBeEnabled();
  await expect(submit(page)).toBeDisabled();
  const pending = await original(page);
  expect(pending.body.team_id).toBe(receipt!.record_id);
  expect(pending.body.operation_id).toBe(receipt!.operation_id);
  await page.reload();
  await expect(form(page)).toContainText("Local team recorded");
  await expect(form(page)).toContainText(receipt!.record_id);
  expect(posts).toBe(1);
  const minimal = await page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key + ":accepted")!),
    key,
  );
  expect(minimal.body).toEqual({
    operation_id: receipt!.operation_id,
    schema_version: 1,
  });
  expect(
    (
      await browserFixtureCall(
        page,
        `${base}/${receipt!.record_id}`,
        undefined,
        baseURL!,
      )
    ).history,
  ).toHaveLength(1);
});

test("AD01 native team creation: absent original needs explicit exact retry, including a second team", async ({
  page,
  baseURL,
}) => {
  await open(page, baseURL!);
  await fill(page);
  await submit(page).click();
  await expect(form(page)).toContainText("Local team recorded");
  await form(page).getByRole("button", { name: "Record another team" }).click();
  await fill(page);
  const bodies: unknown[] = [];
  await page.route(`**/api/v1/${base}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) await route.abort("failed");
    else await route.continue();
  });
  await submit(page).click();
  await expect(
    form(page).getByRole("button", { name: "Check original result" }),
  ).toBeEnabled();
  await form(page)
    .getByRole("button", { name: "Check original result" })
    .click();
  await expect(form(page)).toContainText("does not prove saving failed");
  expect(bodies).toHaveLength(1);
  await form(page)
    .getByRole("button", { name: "Retry unchanged action" })
    .click();
  await expect(form(page)).toContainText("Local team recorded");
  await expect(submit(page)).toHaveCount(0);
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toEqual(bodies[0]);
});

test("AD01 native team creation: storage refusal sends nothing; unsubmitted refresh reviews draft loss", async ({
  page,
  baseURL,
}) => {
  await open(page, baseURL!);
  await fill(page);
  page.once("dialog", (dialog) => dialog.dismiss());
  await form(page)
    .getByRole("button", { name: "Refresh available people" })
    .click();
  await expect(
    form(page).getByLabel("Team purpose", { exact: true }),
  ).not.toHaveValue("");
  let posts = 0;
  page.on("request", (request) => {
    if (
      request.url().endsWith(`/api/v1/${base}`) &&
      request.method() === "POST"
    )
      posts++;
  });
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("ppo-access-team:"))
        throw new Error("Synthetic storage unavailable");
      return original.call(this, key, value);
    };
  });
  await submit(page).click();
  await expect(form(page)).toContainText("Synthetic storage unavailable");
  expect(posts).toBe(0);
  page.once("dialog", (dialog) => dialog.accept());
  await form(page)
    .getByRole("button", { name: "Refresh available people" })
    .click();
  await expect(form(page).getByLabel("Team name", { exact: true })).toHaveValue(
    "",
  );
});

test("AD01 native team creation: actor change withholds original and restores only its owner", async ({
  page,
  baseURL,
}) => {
  await open(page, baseURL!);
  await fill(page);
  await page.route(`**/api/v1/${base}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fetch();
    await route.abort("failed");
  });
  await submit(page).click();
  await expect(
    form(page).getByRole("button", { name: "Retry unchanged action" }),
  ).toBeEnabled();
  const pending = await original(page);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "scheduling-policy-reviewer" },
    baseURL!,
  );
  await page.reload();
  await expect(form(page)).toContainText(
    "requires Workspace team-creation authority",
  );
  await expect(submit(page)).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(
    pending.body.operation_id,
  );
  const denied = await page.request.get(
    `/api/v1/${base}/operations/${pending.body.operation_id}`,
  );
  expect(denied.status()).toBe(403);
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    baseURL!,
  );
  await page.reload();
  await expect(form(page)).toContainText(pending.body.operation_id);
  await expect(form(page)).toContainText("Local team recorded");
});

test("AD01 native team creation: unavailable context retries; command denial clears protected catalogue", async ({
  page,
  baseURL,
}) => {
  await page.route(`**/api/v1/${base}/context`, (route) =>
    route.fulfill({
      status: 503,
      json: { code: "Unavailable", message: "Synthetic context unavailable" },
    }),
  );
  await open(page, baseURL!);
  await expect(form(page)).toContainText("Synthetic context unavailable");
  await expect(submit(page)).toHaveCount(0);
  await page.unroute(`**/api/v1/${base}/context`);
  await form(page).getByRole("button", { name: "Retry loading" }).click();
  await fill(page);
  await page.route(`**/api/v1/${base}`, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 403,
          json: { code: "Forbidden", message: "Synthetic current duty lost" },
        })
      : route.continue(),
  );
  await submit(page).click();
  await expect(page.locator("main")).toContainText(
    "Synthetic current duty lost",
  );
  await expect(form(page)).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Role proposals" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Proposed teams", exact: true }),
  ).toHaveCount(0);
});
