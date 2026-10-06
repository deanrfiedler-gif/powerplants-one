import { test, expect, type Page } from "@playwright/test";
import {
  allocatedHttpFixture,
  conversionDetail,
  json,
  referral,
  acknowledgement,
} from "../helpers/quotation-supply-followup-http";
import {
  receiptProposal,
  receiptReceiving,
  receiptReview,
} from "../helpers/quotation-receipt-correction";
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
async function evidence(page: Page) {
  await page
    .getByLabel("Supply follow-up reason", { exact: true })
    .fill("SYN shared supply compared against corrected receiving");
  await page
    .getByLabel("Supply follow-up evidence", { exact: true })
    .fill("SYN original allocation and all dependent demand versions reviewed");
  await page.getByLabel("Supply synthetic boundary").selectOption("yes");
}
async function saved(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Open saved receiving" }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "6. Owned Supply follow-up" }),
  ).toBeVisible();
}
async function submit(page: Page, label: string, suffix: string) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/conversion/" + suffix) &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: label, exact: true }).click(),
  ]);
  expect(response.status()).toBe(200);
  await saved(page);
}

async function fixture(reviewed = false) {
  const f = await allocatedHttpFixture("Shipment");
  const current = async () =>
    (await conversionDetail(f.owner, f.id)).followups[0];
  await json(f.owner, f.path + "/supply-refer", referral(await current()));
  await json(
    f.owner,
    f.path + "/supply-receive",
    acknowledgement(await current()),
  );
  if (reviewed) {
    await json(
      f.owner,
      f.path + "/receipt-propose",
      receiptProposal(await current()),
    );
    for (const d of (await current()).receipt_correction.required)
      await json(
        f.owner,
        f.path + "/receipt-receive",
        receiptReceiving(await current(), d.demand.id),
      );
    await json(
      f.owner,
      f.path + "/supply-review",
      receiptReview(await current()),
    );
  }
  return { ...f, current };
}
test("ES07 Receipt desktop/mobile exact proposal affected-demand receiving and separate native effect", async ({
  page,
}, info) => {
  const f = await fixture();
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  await page
    .getByText("Propose a Receipt correction for receiving", { exact: true })
    .click();
  await page
    .getByLabel("Corrected Evidenced usable", { exact: true })
    .fill("4.375001");
  await page.getByLabel("Corrected Quarantined", { exact: true }).fill("5");
  await page
    .getByLabel("Corrected Damaged (included in quarantine)", { exact: true })
    .fill("1");
  await page
    .getByLabel("Corrected Receipt evidence", { exact: true })
    .fill("SYN corrected inspected evidence");
  await submit(page, "Save Receipt correction proposal", "receipt-propose");
  const proposal = (await f.current()).receipt_correction.proposal!;
  await evidence(page);
  await page
    .getByLabel("Supply position decision")
    .selectOption("CorrectReceipt");
  await expect(
    page.getByRole("button", {
      name: "Record Supply position review",
      exact: true,
    }),
  ).toBeDisabled();
  for (const d of (await f.current()).receipt_correction.required) {
    await evidence(page);
    await submit(
      page,
      `Record receiving for ${d.demand.reference}`,
      "receipt-receive",
    );
  }
  await evidence(page);
  await page
    .getByLabel("Supply position decision")
    .selectOption("CorrectReceipt");
  await submit(page, "Record Supply position review", "supply-review");
  await evidence(page);
  await submit(page, "Apply exact Supply review", "supply-apply");
  await expect(
    page.getByRole("heading", {
      name: "Completed Receipt correction and retained decisions",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Record receiving for / }),
  ).toHaveCount(0);
  const t = await f.current();
  expect(t.status).toBe("Receipt evidence corrected");
  expect(t.outcome!.receipt_proposal_id).toBe(proposal.id);
  expect(t.receipt_correction.effects!.shortfall).toBe("5.624999");
  expect((await conversionDetail(f.owner, f.id)).dispositions[0].status).toBe(
    "Review required",
  );
  await page
    .getByRole("heading", { name: "Correct existing Receipt evidence" })
    .evaluate((n) => n.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: info.outputPath("receipt-correction.png") });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("receipt-correction-320.png"),
  });
});
test("ES07 Receipt committed lost response recovers the original through reload with one native Receipt effect", async ({
  page,
}) => {
  const f = await fixture(true);
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  let sends = 0;
  let lost!: () => void;
  const committedLostResponse = new Promise<void>((resolve) => {
    lost = resolve;
  });
  await page.route(`**/api/v1/${f.path}/supply-apply`, async (route) => {
    sends++;
    expect((await route.fetch()).ok()).toBe(true);
    await route.abort("failed");
    lost();
  });
  await page.getByRole("button", { name: "Apply exact Supply review" }).click();
  await committedLostResponse;
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await page
    .getByText("Refer, correct or reassign owned follow-up", { exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Refer to Supply owner" }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await saved(page);
  await page.unrouteAll({ behavior: "wait" });
  expect(sends).toBe(1);
  const t = (await conversionDetail(f.owner, f.id)).followups[0];
  expect(t.events.filter((e) => e.action === "Apply")).toHaveLength(1);
  expect(t.status).toBe("Receipt evidence corrected");
  expect(t.receipt_correction.effects!.shortfall).toBe("5.624999");
});
test("ES07 Receipt inconclusive unsent original blocks replacement and exact retry retains original content", async ({
  page,
}) => {
  const f = await fixture(true);
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  let original = "";
  await page.route(`**/api/v1/${f.path}/supply-apply`, async (route) => {
    original = route.request().postData()!;
    await route.abort("failed");
  });
  await page.route("**/api/v1/operations/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "SYN inconclusive original lookup",
      }),
    }),
  );
  await page.getByRole("button", { name: "Apply exact Supply review" }).click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record Supply position review" }),
  ).toBeDisabled();
  await page.unrouteAll({ behavior: "wait" });
  let retried = "";
  await page.route(`**/api/v1/${f.path}/supply-apply`, async (route) => {
    retried = route.request().postData()!;
    await route.continue();
  });
  const [retryResponse] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith(f.path + "/supply-apply") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Retry exact original" }).click(),
  ]);
  expect(retryResponse.status()).toBe(200);
  await saved(page);
  expect(retried).toBe(original);
  expect(
    (await conversionDetail(f.owner, f.id)).followups[0].receipt_correction
      .effects!.shortfall,
  ).toBe("5.624999");
});
