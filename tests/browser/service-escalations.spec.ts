import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import {
  escalationRecord,
  escalationRegister,
  escalationId,
} from "../helpers/escalations-fixture";
import { destinations } from "../../src/shell/navigation";
async function setup(
  page: Page,
  {
    denied = false,
    uncertain = false,
    state = "ReplyToActOn" as "ReplyToActOn" | "Diagnosing",
  } = {},
) {
  const detail = escalationRecord(state),
    posts: Record<string, unknown>[] = [];
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (r) => r.abort());
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({
      json: {
        items: [],
        observed_at: detail.record.updated_at,
        completeness: "Complete",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: detail.record.owner_id,
        workspace_id: detail.record.workspace_id,
        display_name: detail.record.owner_name,
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: detail.record.owner_name,
        preference_scope: "sv08-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
  await page.route("**/api/v1/service/escalations**", async (r) => {
    if (denied)
      return r.fulfill({
        status: 403,
        json: { code: "Forbidden", message: "Case duty required." },
      });
    if (r.request().method() === "POST") {
      posts.push(r.request().postDataJSON());
      if (uncertain && posts.length === 1)
        return r.fulfill({
          status: 503,
          json: {
            code: "OutcomeUnknown",
            message: "Result unconfirmed",
            retryable: true,
          },
        });
      detail.record.version++;
      detail.record.next_action_id = detail.finding.action!.id;
      detail.record.next_action_reply_id = detail.record.last_reply_id;
      return r.fulfill({
        json: {
          record_id: escalationId,
          record_version: detail.record.version,
          state: detail.record.state,
          replayed: posts.length > 1,
        },
      });
    }
    return r.fulfill({
      json: new URL(r.request().url()).pathname.endsWith(escalationId)
        ? detail
        : escalationRegister(),
    });
  });
  return { detail, posts };
}
test("SV08 denied reads hide records and counts", async ({ page }) => {
  await setup(page, { denied: true });
  await page.goto("/service/escalations");
  await expect(page.getByText("Case duty required.")).toBeVisible();
  await expect(page.getByText("SYN-ESC-000002")).toHaveCount(0);
  await expect(page.getByText(/1 permitted cases/)).toHaveCount(0);
});
test("SV08 tabs preserve draft entries and uncertain action retries keep exact original payload", async ({
  page,
}) => {
  const { posts } = await setup(page, { uncertain: true });
  await page.goto(`/service/escalations?case=${escalationId}`);
  await page
    .getByLabel("Next action", { exact: true })
    .fill("SYN check the plug before proposing a settings change");
  await page
    .getByLabel("Reason for this record", { exact: true })
    .fill("SYN reviewed received advice");
  await page
    .getByLabel("Grower approval is required before changing settings.")
    .check();
  await page.getByRole("tab", { name: /Diagnosis/ }).click();
  await page.getByRole("tab", { name: /Reply|Correspondence/ }).click();
  await expect(page.getByLabel("Next action", { exact: true })).toHaveValue(
    "SYN check the plug before proposing a settings change",
  );
  await page
    .getByRole("button", { name: "Record next action", exact: true })
    .last()
    .click();
  await expect(page.getByText(/The result is unconfirmed/)).toBeVisible();
  await expect(page.getByLabel("Next action", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Retry unchanged action" }).click();
  await expect(
    page.getByRole("heading", { name: "Owned next action" }),
  ).toBeVisible();
  expect(posts).toHaveLength(2);
  expect(posts[1]).toEqual(posts[0]);
});
for (const width of [1440, 1024, 390, 320])
  test(`SV08 visual comparison fixture at ${width}px`, async ({ page }) => {
    await setup(page);
    await page.setViewportSize({
      width,
      height: width === 1440 ? 900 : width === 1024 ? 900 : 844,
    });
    await page.goto("/service/escalations");
    if (width === 1024)
      await page
        .getByRole("button", {
          name: "Collapse primary navigation",
          exact: true,
        })
        .click();
    await expect(
      page.getByRole("button", {
        name: /Boiler controller BC-2 shows fault E-17/,
      }),
    ).toBeVisible();
    await mkdir("tmp/sv08-captures", { recursive: true });
    await page.screenshot({
      path: `tmp/sv08-captures/register-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: /Boiler controller BC-2 shows fault E-17/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "Manufacturer reply" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Next action", { exact: true }),
    ).toBeAttached();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `tmp/sv08-captures/reply-${width}.png`,
      fullPage: true,
    });
    await page
      .getByLabel("Next action", { exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/sv08-captures/next-action-${width}.png`,
      fullPage: true,
    });
  });

test("SV08 diagnosing and Record as sent expose the retained desktop task states", async ({
  page,
}) => {
  const { detail } = await setup(page, { state: "Diagnosing" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/service/escalations?case=${escalationId}`);
  await expect(
    page.getByRole("heading", { name: "Diagnostics already tried" }),
  ).toBeVisible();
  await mkdir("tmp/sv08-captures", { recursive: true });
  await page.screenshot({
    path: "tmp/sv08-captures/diagnosing-1440.png",
    fullPage: true,
  });
  detail.record.reviewed_pack_id = detail.record.latest_pack_id;
  detail.packs[0].reviewed_at = detail.record.updated_at;
  await page.reload();
  await page.getByRole("tab", { name: "Correspondence" }).click();
  await page
    .getByRole("button", { name: "Record as sent", exact: true })
    .click();
  await expect(page.getByLabel("Who sent it")).toBeVisible();
  await expect(
    page.getByText(/Recording sends nothing. Send the pack/),
  ).toBeVisible();
  await page.screenshot({
    path: "tmp/sv08-captures/record-sent-1440.png",
    fullPage: true,
  });
});
