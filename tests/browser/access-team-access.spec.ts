import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { browserFixtureCall } from "../helpers/browser-fixture-call";

const actor = "30000000-0000-4000-8000-000000000003";
const member = "30000000-0000-4000-8000-000000000005";
async function create(page: Page, origin: string, memberId = member) {
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "systems" },
    origin,
  );
  const input = {
    schema_version: 1,
    operation_id: randomUUID(),
    team_id: randomUUID(),
    expected_version: 0,
    name: `SYN access roster ${randomUUID().slice(0, 8)}`,
    purpose: "Inspect this explicit synthetic member roster.",
    reason: "Prepare current access inspection without assigning authority.",
    lead_id: actor,
    member_ids: [memberId],
  };
  await browserFixtureCall(page, "admin/access/teams", input, origin);
  return input;
}
const card = (page: Page, name: string) =>
  page.getByRole("article", { name: `${name} saved team` });
const inspect = (page: Page, name: string) =>
  card(page, name).getByRole("button", { name: `Inspect roster for ${name}` });

test("AD01 team access: read-only inspector follows exact member access without granting authority", async ({
  page,
  baseURL,
}) => {
  const input = await create(page, baseURL!);
  const before = await browserFixtureCall(
    page,
    `admin/access/${member}`,
    undefined,
    baseURL!,
  );
  await browserFixtureCall(
    page,
    "local-session",
    { profile: "scheduling-policy-reviewer" },
    baseURL!,
  );
  await page.goto("/admin/access/roles");
  await expect(
    page.getByRole("button", { name: "Record team", exact: true }),
  ).toHaveCount(0);
  await inspect(page, input.name).click();
  const saved = card(page, input.name);
  await expect(saved).toContainText(
    "Recorded grant rows, not effective business access or review authority",
  );
  await expect(saved).toContainText("Member access checked");
  await expect(saved).toContainText(
    `Recorded grants: ${before.grants.length}.`,
  );
  const links = saved.getByRole("link", { name: /Inspect person access for/ });
  await expect(links).toHaveCount(1);
  await expect(links).toHaveAttribute("href", `/admin/access/${member}`);
  await expect(saved).toContainText(input.operation_id);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await links.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/admin/access/${member}$`));
  await expect(
    page.getByRole("heading", { name: "Person access", exact: true }),
  ).toBeVisible();
  const after = await browserFixtureCall(
    page,
    `admin/access/${member}`,
    undefined,
    baseURL!,
  );
  expect(after.grants).toEqual(before.grants);
});

test("AD01 team access: refresh withholds stale counts, keeps creation draft and renders explicit identity limits", async ({
  page,
  baseURL,
}) => {
  const input = await create(page, baseURL!);
  await page.goto("/admin/access/roles");
  await page
    .getByLabel("Team name", { exact: true })
    .fill("SYN unfinished draft");
  await inspect(page, input.name).click();
  const saved = card(page, input.name);
  await expect(saved).toContainText("Recorded grants:");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let entered!: () => void;
  const requested = new Promise<void>((resolve) => {
    entered = resolve;
  });
  await page.route(
    `**/api/v1/admin/access/teams/${input.team_id}`,
    async (route) => {
      const response = await route.fetch(),
        body = await response.json();
      entered();
      await gate;
      // Presentation-only identities; SQL tests prove masking and state classification.
      const original = body.members[0];
      await route.fulfill({
        response,
        json: {
          ...body,
          members: [
            {
              ...original,
              active: false,
              grant_counts: {
                recorded: 4,
                current: 0,
                scheduled: 0,
                expired: 0,
                inactive: 4,
              },
            },
            {
              ...original,
              user_id: "70000000-0000-4000-8000-000000000001",
              display_name: "SYN Zero grant member",
              grant_counts: {
                recorded: 0,
                current: 0,
                scheduled: 0,
                expired: 0,
                inactive: 0,
              },
            },
            {
              ...original,
              user_id: "70000000-0000-4000-8000-000000000002",
              display_name: "Hosted identity (masked)",
              masked: true,
              grant_counts: null,
            },
          ],
        },
      });
    },
  );
  await saved.getByRole("button", { name: "Refresh member access" }).click();
  await requested;
  await expect(saved.getByText(/Recorded grants:/)).toHaveCount(0);
  release();
  await expect(saved).toContainText("Inactive identity: 4");
  await expect(saved).toContainText("Recorded grants: 0");
  await expect(saved).toContainText(
    "Access not inspected for this masked identity",
  );
  await expect(
    saved.getByRole("link", { name: /Hosted identity/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Team name", { exact: true })).toHaveValue(
    "SYN unfinished draft",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("AD01 team access: unavailable and denied refresh never retain current-looking counts", async ({
  page,
  baseURL,
}) => {
  const input = await create(page, baseURL!);
  await page.goto("/admin/access/roles");
  await inspect(page, input.name).click();
  const saved = card(page, input.name);
  await expect(saved).toContainText("Recorded grants:");
  const path = `**/api/v1/admin/access/teams/${input.team_id}`;
  await page.route(path, (route) =>
    route.fulfill({
      status: 503,
      json: {
        code: "Unavailable",
        message: "Synthetic member read unavailable",
      },
    }),
  );
  await saved.getByRole("button", { name: "Refresh member access" }).click();
  await expect(
    page.getByText("Synthetic member read unavailable"),
  ).toBeVisible();
  await expect(saved).toHaveCount(0);
  await page.unroute(path);
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await inspect(page, input.name).click();
  await expect(saved).toContainText("Recorded grants:");
  await page.route(path, (route) =>
    route.fulfill({
      status: 403,
      json: { code: "Forbidden", message: "Synthetic inspection duty removed" },
    }),
  );
  await saved.getByRole("button", { name: "Refresh member access" }).click();
  await expect(
    page.getByText("Synthetic inspection duty removed"),
  ).toBeVisible();
  await expect(saved).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Role proposals" }),
  ).toHaveCount(0);
});

test("AD01 team access: delayed previous roster cannot replace the newly selected team", async ({
  page,
  baseURL,
}) => {
  const first = await create(page, baseURL!),
    second = await create(page, baseURL!, actor);
  await page.goto("/admin/access/roles");
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    entered = resolve;
  });
  await page.route(
    `**/api/v1/admin/access/teams/${first.team_id}`,
    async (route) => {
      const response = await route.fetch();
      entered();
      await gate;
      await route.fulfill({ response });
    },
  );
  await inspect(page, first.name).click();
  await requested;
  await inspect(page, second.name).click();
  await expect(
    card(page, second.name).getByRole("link", {
      name: /Inspect person access for/,
    }),
  ).toHaveAttribute("href", `/admin/access/${actor}`);
  const lateResponse = page.waitForResponse(
    response => response.url().endsWith(`/admin/access/teams/${first.team_id}`),
  );
  release();
  await (await lateResponse).finished();
  await page.evaluate(() => new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ));
  await expect(
    card(page, first.name).getByRole("link", {
      name: /Inspect person access for/,
    }),
  ).toHaveCount(0);
  await expect(card(page, second.name)).toContainText(second.operation_id);
  await expect(card(page, second.name)).not.toContainText(first.operation_id);
});
