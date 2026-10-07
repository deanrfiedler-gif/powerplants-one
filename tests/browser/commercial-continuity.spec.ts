import { test, expect } from "@playwright/test";
import {
  responseHttpFixture,
  response,
  responseDetail,
  responsePath,
  json,
} from "../helpers/quotation-response-http";

test.describe.configure({ timeout: 120000 });
test("LC-14 Deal exposes exact issued response and correction without relabelling it as a draft or changing Won", async ({
  page,
}, info) => {
  const f = await responseHttpFixture();
  await json(f.owner, responsePath(f.id) + "/record", response(f.d));
  await page.goto("/work");
  await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(page.url()).origin },
    data: { profile: "coordinator" },
  });
  await page.goto(`/sales/opportunities/${f.input.opportunity_id}`);
  await page
    .getByRole("tab", { name: "Estimates & quotations", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Release revision 2/ }),
  ).toBeVisible();
  await page
    .getByText("Issue, reported response and conversion evidence", {
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Independent approval: Approved. Issue: Recorded.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Staff-recorded response: Accepted.", { exact: true }),
  ).toBeVisible();
  await page.getByText("Native conversion evidence", { exact: true }).click();
  await expect(
    page.getByText(
      "Native Supply conversion: Not recorded · 0 permitted destination records.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Saved sales outcome")).toHaveText(
    "Outcome: Open",
  );
  const accepted = await responseDetail(f.owner, f.id);
  await json(f.owner, responsePath(f.id) + "/record", {
    ...response(accepted, "Declined"),
    action: "Correct",
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByText("Staff-recorded response: Declined.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Staff-recorded response: Accepted.", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("heading", { name: "Quotations across all permitted estimates" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("deal-exact-commercial-evidence.png"),
  });
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await expect(page.getByText(/Release quotation · revision 2/)).toBeVisible();
  await expect(page.getByText(/Draft quotation · revision 1/)).toBeVisible();
});

test("LC-14 a denied native refresh removes previously displayed issue facts and retains explicit recovery", async ({
  page,
}) => {
  const f = await responseHttpFixture();
  await page.goto("/work");
  await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(page.url()).origin },
    data: { profile: "coordinator" },
  });
  await page.goto(`/sales/opportunities/${f.input.opportunity_id}`);
  await page
    .getByRole("tab", { name: "Estimates & quotations", exact: true })
    .click();
  await page
    .getByText("Issue, reported response and conversion evidence", {
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Independent approval: Approved. Issue: Recorded.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.route(`**/api/v1/estimating/quotes/${f.id}/release`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "Forbidden", message: "SYN denied refreshed release" },
      }),
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByText(
      "Release evidence is restricted or unavailable with current access.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Independent approval: Approved. Issue: Recorded.", {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry Release evidence", exact: true }),
  ).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
  await page
    .getByRole("button", { name: "Retry Release evidence", exact: true })
    .click();
  await expect(
    page.getByText("Independent approval: Approved. Issue: Recorded.", {
      exact: true,
    }),
  ).toBeVisible();
});
