import { expect, type Page } from "@playwright/test";
import { keyActivate, keyType } from "./quality-keyboard";
import { observedResponse, RENDER_LEASE_MS } from "./observed-response";
export async function completion(page: Page, quantities = true) {
  // A saved entry is followed by an authorised refresh. Use that new source
  // before assembling the next exact completion command.
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Completion", exact: true }).click();
  await page
    .getByLabel("Actual work performed", { exact: true })
    .fill(
      "SYN completed visual inspection. " +
        "Uncertain label identity remains explicit; no intervention was authorised. ".repeat(
          35,
        ),
    );
  await page
    .getByLabel("Exclusions and limits", { exact: true })
    .fill(
      "SYN no intervention, no whole-project acceptance and no financial treatment.",
    );
  await page
    .getByLabel("Remaining work and reasons", { exact: true })
    .fill(
      "SYN second task requires a separately authorised return. Service coordinator owns identification and contact.",
    );
  await page
    .getByLabel("My time declaration", { exact: true })
    .selectOption(quantities ? "AllRecorded" : "None");
  await page
    .getByLabel("My material declaration", { exact: true })
    .selectOption(quantities ? "AllRecorded" : "None");
  await page
    .getByLabel("Declaration explanation", { exact: true })
    .fill(
      "SYN my own captured quantities are complete as declared. Crew acknowledgements and booking duration create no actual quantities.",
    );
  const fields = page.getByLabel(/Task \d+ explanation/);
  for (let n = 0; n < (await fields.count()); n++)
    await fields
      .nth(n)
      .fill(
        n
          ? "SYN remaining task awaits return crew and confirmed booking."
          : "SYN visual inspection attempted; identity remains uncertain.",
      );
  const savedDrafts = page.getByRole("heading", {
    name: /Saved completion draft v/,
  });
  const previousDrafts = await savedDrafts.count();
  await page
    .getByRole("button", { name: "Save completion draft", exact: true })
    .click();
  await expect(savedDrafts).toHaveCount(previousDrafts + 1);
  await expect(savedDrafts.first()).toBeVisible();
}
export async function submit(page: Page, recoverOwner = false) {
  await keyType(
    page,
    page.getByLabel("Submission reason", { exact: true }),
    "SYN submit my exact completion evidence for authorised review.",
  );
  await keyActivate(
    page,
    page.getByRole("button", {
      name: "Submit exact evidence for review",
      exact: true,
    }),
  );
  if (recoverOwner) {
    await expect(page.locator('.business-error[role="alert"]')).toContainText(
      "Cached workspace is locked or expired",
    );
    const opened = page.waitForEvent("popup");
    await keyActivate(
      page,
      page.getByRole("link", {
        name: "Verify saved workspace in another tab",
        exact: true,
      }),
    );
    const savedWorkspace = await opened;
    await keyActivate(
      savedWorkspace,
      savedWorkspace.getByRole("button", {
        name: "Verify identity online",
        exact: true,
      }),
    );
    await expect(savedWorkspace.locator("#notice")).toContainText(
      "Identity verified",
    );
    await expect(savedWorkspace.locator("#queue .status")).toHaveText(
      Array(5).fill("ServerSaved"),
    );
    await savedWorkspace.close();
    await expect(
      page.getByLabel("Submission reason", { exact: true }),
    ).toHaveValue(
      "SYN submit my exact completion evidence for authorised review.",
    );
    await keyActivate(
      page,
      page.getByRole("button", {
        name: "Submit exact evidence for review",
        exact: true,
      }),
    );
  }
  await expect(
    page
      .getByRole("link", { name: "Open report review and revision history" })
      .locator(".."),
  ).toContainText("Submitted");
  const reportLink = page.getByRole("link", {
    name: "Open report review and revision history",
  });
  const reportId = (await reportLink.getAttribute("href"))!.split("/").at(-1);
  const reportRead = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname === `/api/v1/reports/${reportId}`,
  );
  await reportLink.click();
  expect((await reportRead).ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: /Revision \d+ · Submitted/ }),
  ).toBeVisible();
}
export async function review(page: Page, returned = false, commit = true) {
  const fields = page.getByLabel(/Entry \d+ review reason/);
  await expect(fields.first()).toBeVisible();
  for (let n = 0; n < (await fields.count()); n++)
    await fields
      .nth(n)
      .fill(
        returned
          ? "SYN correct the customer finding while retaining the original capture."
          : "SYN exact factual evidence checked; no financial treatment.",
      );
  if (returned) {
    await page
      .getByRole("group", { name: /^Observation · v/ })
      .getByLabel(/Entry \d+ decision/, { exact: true })
      .selectOption("Returned");
    await page
      .getByLabel("Review decision", { exact: true })
      .selectOption("Returned");
  }
  if (!returned)
    await page
      .getByLabel("Customer audience", { exact: true })
      .selectOption({ index: 1 });
  await page
    .getByLabel("Review remarks (internal)", { exact: true })
    .fill(
      returned
        ? "SYN RETURN: explain the attempted fix and uncertain result."
        : "SYN P11_PRIVATE_REVIEW_CANARY: factual attendance accepted; remaining work stays owned.",
    );
  if (!commit) return;
  await page
    .getByRole("button", { name: "Commit exact review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: returned ? /Revision \d+ · Returned/ : /Revision \d+ · Reviewed/,
    }),
  ).toBeVisible();
}
export async function issue(page: Page) {
  const requested = page.waitForResponse(
    (r) =>
      /\/api\/v1\/reports\/[^/]+\/issue$/.test(r.url()) &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Request exact report issue", exact: true })
    .click();
  expect((await requested).status()).toBe(202);
  await expect(
    page.getByRole("button", {
      name: "Generate / recover original report",
      exact: true,
    }),
  ).toBeVisible();
  // Rendering is an asynchronous controlled command. Observe its actual result
  // before asserting the refreshed UI; an arbitrary five-second render race
  // does not establish whether the original output was issued.
  const response = await observedResponse(page, "report-render",
    (r) =>
      /\/api\/v1\/report-render-jobs\/[^/]+\/retry$/.test(r.url()) &&
      r.request().method() === "POST",
    () => page
      .getByRole("button", {
        name: "Generate / recover original report",
        exact: true,
      })
      .click(),
    { timeout: RENDER_LEASE_MS },
  );
  expect(response.status(), await response.text()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  const output = await response.json();
  expect(output.state).toBe("Issued");
  expect(output.issue_id).toBeTruthy();
  expect(output.output_available).toBe(true);
  expect(output.attempts).toBeGreaterThan(0);
  await expect(
    page.getByRole("heading", { name: /Revision \d+ · Issued/ }),
  ).toBeVisible();
}
