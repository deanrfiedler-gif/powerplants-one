import { test, expect, type Page } from "@playwright/test";
import {
  responseHttpFixture,
  responseDetail,
  responsePath,
  response,
  json,
} from "../helpers/quotation-response-http";
test.describe.configure({ timeout: 120000 });
async function identity(page: Page, profile = "coordinator") {
  await page.goto("/work");
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(page.url()).origin },
        data: { profile },
      })
    ).ok(),
  ).toBe(true);
}
async function enter(page: Page) {
  await page
    .getByLabel("Reason for this record or correction")
    .fill("SYN exact fictional conversation");
  await page
    .getByLabel("Synthetic response evidence", { exact: true })
    .fill("SYN Pat reported this exact whole offer accepted");
  await page
    .getByLabel("Synthetic recording acknowledgement")
    .selectOption("yes");
  await page
    .getByLabel("Stated respondent", { exact: true })
    .fill("Fictional Pat");
  await page.getByLabel("Claimed respondent role").fill("Reported buyer");
  await page
    .getByLabel("Reported response time (UTC)")
    .fill(new Date().toISOString());
}
async function saved(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Open saved response" }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Immutable response history" }),
  ).toBeVisible();
}
test("ES06 desktop/mobile exact reported acceptance recovers lost response, prepares receiving review and retains correction", async ({
  page,
}, info) => {
  const f = await responseHttpFixture();
  await identity(page);
  await page.goto(`/estimating/quotes/${f.id}/release`);
  await page
    .getByRole("link", { name: "Open exact quotation response" })
    .click();
  await enter(page);
  let sends = 0;
  await page.route(`**/api/v1/${responsePath(f.id)}/record`, async (route) => {
    sends++;
    const r = await route.fetch();
    expect(r.ok()).toBe(true);
    await route.abort("failed");
  });
  await page
    .getByRole("button", { name: "Record exact reported response" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Prepare exact ES-07 review handover" }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await saved(page);
  expect(sends).toBe(1);
  await page.unrouteAll({ behavior: "wait" });
  const accepted = await responseDetail(f.owner, f.id);
  expect(accepted.events).toHaveLength(1);
  expect(accepted.state.ready).toBe(true);
  await enter(page);
  await page.getByLabel("Preparation follow-up due date").fill("2026-10-10");
  await page
    .getByLabel("Receiving note and remaining checks")
    .fill("SYN authority, terms and items remain for independent ES07 review");
  await page
    .getByRole("button", { name: "Prepare exact ES-07 review handover" })
    .click();
  await saved(page);
  await expect(
    page.getByText("Prepared for receiving review", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("response-prepared.png"),
    fullPage: true,
  });
  await enter(page);
  await page.getByLabel("Record type").selectOption("Correct");
  await page.getByLabel("Reported outcome").selectOption("Declined");
  await page
    .getByRole("button", { name: "Record exact reported response" })
    .click();
  await saved(page);
  await expect(
    page.getByText("Prepared handover held", { exact: true }),
  ).toBeVisible();
  const corrected = await responseDetail(f.owner, f.id);
  expect(corrected.events[0]).toEqual(accepted.events[0]);
  expect(corrected.events[2].response_id).toBe(accepted.events[0].id);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByText("Exact offer binding", { exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("response-320.png"),
    fullPage: false,
  });
});
test("ES06 inconclusive receipt retains original and prevents replacement; exact retry and identity change", async ({
  page,
}) => {
  const f = await responseHttpFixture();
  await identity(page);
  await page.goto("/" + responsePath(f.id));
  await enter(page);
  let original: string | undefined;
  await page.route(`**/api/v1/${responsePath(f.id)}/record`, async (route) => {
    original = route.request().postData()!;
    await route.abort("failed");
  });
  await page.route("**/api/v1/operations/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "SYN inconclusive receipt lookup",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Record exact reported response" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Recover original response receipt" })
    .click();
  await expect(
    page.getByRole("button", { name: "Record exact reported response" }),
  ).toBeDisabled();
  await page.unroute(`**/api/v1/${responsePath(f.id)}/record`);
  let retry: string | undefined;
  page.on("request", (r) => {
    if (r.url().endsWith("/response/record")) retry = r.postData()!;
  });
  await page
    .getByRole("button", { name: "Retry exact original", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  expect(retry).toBe(original);
  await page.unrouteAll({ behavior: "wait" });
  await saved(page);
  await identity(page, "second-company");
  await page.goto("/" + responsePath(f.id));
  await expect(
    page.getByRole("heading", { name: "Immutable response history" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry permitted read" }),
  ).toBeVisible();
});
test("ES06 stale concurrent evidence retains entries; material negotiation requires successor", async ({
  page,
}) => {
  const f = await responseHttpFixture();
  await identity(page);
  await page.goto("/" + responsePath(f.id));
  await enter(page);
  await json(
    f.owner,
    responsePath(f.id) + "/record",
    response(f.d, "Negotiation"),
  );
  await page
    .getByRole("button", { name: "Record exact reported response" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Refresh permitted evidence" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Response basis changed" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Stated respondent", { exact: true }),
  ).toHaveValue("Fictional Pat");
  await page
    .getByRole("button", { name: "Use current response basis" })
    .click();
  await expect(
    page.getByRole("button", { name: "Record exact reported response" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Prepare exact ES-07 review handover" }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "Material negotiation requires an explicit ES-05 successor issue.",
      { exact: true },
    ),
  ).toBeVisible();
});
