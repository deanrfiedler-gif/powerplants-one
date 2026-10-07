import { test, expect, type Page } from "@playwright/test";
import {
  responseHttpFixture,
  response,
  responseDetail,
  responsePath,
  json,
} from "../helpers/quotation-response-http";

test.describe.configure({ timeout: 120000 });
async function fixture(page: Page) {
  const f = await responseHttpFixture(true);
  await json(f.owner, responsePath(f.id) + "/record", response(f.d));
  await page.goto("/work");
  await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(page.url()).origin },
    data: { profile: "coordinator" },
  });
  await page.goto(`/sales/opportunities/${f.input.opportunity_id}`);
  await page
    .getByRole("button", { name: "Record sales outcome", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Record outcome", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByLabel("Outcome evidence source", { exact: true })
    .selectOption("Quotation");
  await dialog
    .getByLabel("Quotation release to review", { exact: true })
    .selectOption(f.id);
  await expect(
    dialog.getByText("Current reported response: Accepted · Revision 2.", {
      exact: true,
    }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Review quotation basis", exact: true })
    .click();
  await dialog
    .getByLabel("Acceptance or order evidence")
    .fill("SYN fictional accepted scope reviewed for this Deal");
  return { ...f, dialog };
}

test("LC-15 quotation outcome recovers the exact original after a lost response and later native correction", async ({
  page,
}, info) => {
  const f = await fixture(page),
    path = `crm/opportunities/${f.input.opportunity_id}/outcome`;
  let operation = "";
  await page.route(
    `**/api/v1/${path}`,
    async (route) => {
      operation = route.request().postDataJSON().operation_id;
      const result = await route.fetch();
      expect(result.ok(), await result.text()).toBe(true);
      await route.abort("connectionfailed");
    },
    { times: 1 },
  );
  await f.dialog
    .getByRole("button", { name: "Record outcome", exact: true })
    .click();
  await expect(
    f.dialog.getByRole("button", { name: "Confirm original save outcome" }),
  ).toBeVisible();
  await expect(
    f.dialog.getByLabel("Outcome evidence source", { exact: true }),
  ).toBeDisabled();
  await json(f.owner, responsePath(f.id) + "/record", {
    ...response(await responseDetail(f.owner, f.id), "Declined"),
    action: "Correct",
  });
  await f.dialog
    .getByRole("button", { name: "Confirm original save outcome" })
    .click();
  await expect(f.dialog).not.toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Saved sales outcome")).toHaveText(
    "Outcome: Won",
  );
  await page.getByRole("tab", { name: "History", exact: true }).click();
  const history = page.getByRole("region", {
    name: "Recorded outcome evidence",
  });
  await expect(history).toContainText("Recorded response: Accepted.");
  await expect(history).toContainText(
    "Latest report on this revision: Declined.",
  );
  await expect(history).toContainText(
    "The saved sales outcome and its original evidence remain retained.",
  );
  await history.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("outcome-original-evidence.png"),
  });
  const saved = (
    await json(f.owner, `crm/opportunities/${f.input.opportunity_id}`)
  ).items[0];
  expect(saved.version).toBe(6);
  expect(
    saved.events.filter(
      (e: { event_type: string }) =>
        e.event_type === "OpportunityOutcomeRecorded",
    ),
  ).toHaveLength(1);
  expect((await json(f.owner, `operations/${operation}`)).state).toBe("Won");
});

test("LC-15 background refresh preserves the reviewed comparison and stale submission has no outcome effect", async ({
  page,
}, info) => {
  const f = await fixture(page),
    id = f.input.opportunity_id;
  const first = (
    await json(
      f.owner,
      `crm/opportunities/${id}/outcome-basis?revision_id=${f.id}`,
    )
  ).source;
  await json(f.owner, responsePath(f.id) + "/record", {
    ...response(await responseDetail(f.owner, f.id)),
    action: "Correct",
  });
  await f.dialog
    .getByRole("button", { name: "Refresh quotation evidence", exact: true })
    .click();
  await expect(
    f.dialog.getByText(
      "The quotation response changed after review. Discard this comparison and review the current evidence.",
      { exact: true },
    ),
  ).toBeVisible();
  const rejected = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/crm/opportunities/${id}/outcome`) &&
      r.request().method() === "POST",
  );
  await f.dialog
    .getByRole("button", { name: "Record outcome", exact: true })
    .click();
  const result = await rejected;
  expect(result.status()).toBe(409);
  expect(result.request().postDataJSON().commercial_source).toEqual(first);
  expect(
    (await json(f.owner, `crm/opportunities/${id}`)).items[0].close_outcome,
  ).toBe("Open");
  await f.dialog
    .getByRole("button", { name: "Discard quotation comparison", exact: true })
    .click();
  await f.dialog
    .getByRole("button", { name: "Review quotation basis", exact: true })
    .click();
  await f.dialog
    .getByRole("region", { name: "Reviewed quotation basis" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("outcome-deliberate-review.png"),
  });
  await f.dialog
    .getByRole("button", { name: "Record outcome", exact: true })
    .click();
  await expect(f.dialog).not.toBeVisible();
  expect(
    (await json(f.owner, `crm/opportunities/${id}`)).items[0].close_outcome,
  ).toBe("Won");
});

test("LC-15 denied refresh removes the native comparison and requires a fresh explicit source choice", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.route(
    `**/api/v1/crm/opportunities/${f.input.opportunity_id}/outcome-basis?*`,
    (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "Forbidden", message: "SYN denied outcome evidence" },
        }),
      }),
  );
  await f.dialog
    .getByRole("button", { name: "Refresh quotation evidence", exact: true })
    .click();
  await expect(
    f.dialog.getByText(
      "Quotation evidence is restricted or unavailable with current access. Review it again after access is restored.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    f.dialog.getByRole("region", { name: "Reviewed quotation basis" }),
  ).toHaveCount(0);
  await expect(
    f.dialog.getByRole("button", { name: "Record outcome", exact: true }),
  ).toBeDisabled();
  await f.dialog
    .getByLabel("Outcome evidence source", { exact: true })
    .selectOption("Independent");
  await f.dialog
    .getByLabel("Separate outcome evidence", { exact: true })
    .fill("SYN separate order evidence reviewed independently");
  await f.dialog
    .getByRole("button", { name: "Record outcome", exact: true })
    .click();
  await expect(f.dialog).not.toBeVisible();
  const saved = (
    await json(f.owner, `crm/opportunities/${f.input.opportunity_id}`)
  ).items[0];
  expect(saved.outcome_sources[0].kind).toBe("Independent");
  expect(saved.outcome_sources[0].evidence).toBe(
    "SYN separate order evidence reviewed independently",
  );
});
