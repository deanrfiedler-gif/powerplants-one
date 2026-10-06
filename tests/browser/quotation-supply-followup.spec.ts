import { test, expect, type Page } from "@playwright/test";
import {
  allocatedHttpFixture,
  reviewedHttpFixture,
  reservationHttpFixture,
  conversionDetail,
  json,
  referral,
  acknowledgement,
} from "../helpers/quotation-supply-followup-http";
import { receiving } from "../helpers/quotation-conversion";
test.describe.configure({ timeout: 120000 });
async function identity(page: Page, profile = "coordinator") {
  await page.goto("/work");
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        // This fixture may switch again at the server's idle socket boundary.
        // Own each connection; preserve exactly one request, without replay.
        headers: { Origin: new URL(page.url()).origin, Connection: "close" },
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

test("ES07 Supply desktop/mobile owned referral, receiving, real adjustment and returned evidence", async ({
  page,
}, info) => {
  const f = await allocatedHttpFixture();
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  await page
    .getByLabel("Proposed Supply follow-up")
    .fill("SYN compare allocation quantities and return exact evidence");
  await submit(page, "Refer to Supply owner", "supply-refer");
  await evidence(page);
  await submit(page, "Record Supply receiving decision", "supply-receive");
  await evidence(page);
  await page
    .getByLabel("Supply position decision")
    .selectOption("AdjustAllocation");
  await page.getByLabel("Proposed allocation quantity").fill("1.375001");
  await submit(page, "Record Supply position review", "supply-review");
  expect(
    (await conversionDetail(f.owner, f.id)).followups[0].basis.conversion
      .dependencies.allocations[0].quantity,
  ).toBe("2");
  await evidence(page);
  await submit(page, "Apply exact Supply review", "supply-apply");
  const d = await conversionDetail(f.owner, f.id);
  expect(
    d.followups[0].basis.conversion.dependencies.allocations[0].quantity,
  ).toBe("1.375001");
  expect(d.dispositions[0].status).toBe("Review required");
  await page
    .getByText("Current allocations, shared supply and affected demands", {
      exact: true,
    })
    .click();
  await expect(
    page.getByText(/Other demand sharing this supply/),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "6. Owned Supply follow-up" })
    .evaluate((n) => n.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: info.outputPath("supply-followup.png") });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page
    .getByRole("heading", { name: "6. Owned Supply follow-up" })
    .evaluate((n) => n.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: info.outputPath("supply-followup-320.png") });
});
test("ES07 Supply committed lost response recovers the original through reload with one native allocation effect", async ({
  page,
}) => {
  const f = await reviewedHttpFixture();
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
  expect(t.basis.conversion.dependencies.allocations[0].version).toBe(2);
});
test("ES07 Supply inconclusive unsent original blocks replacement and exact retry retains original content", async ({
  page,
}) => {
  const f = await reviewedHttpFixture();
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
    (await conversionDetail(f.owner, f.id)).followups[0].basis.conversion
      .dependencies.allocations[0].quantity,
  ).toBe("1.375001");
});
test("ES07 Supply receiving worklist, stale proposal, explicit return and denied evidence", async ({
  page,
}) => {
  const f = await allocatedHttpFixture();
  await json(f.owner, f.path + "/supply-refer", referral(f.d.followups[0]));
  let d = await conversionDetail(f.owner, f.id);
  await json(
    f.owner,
    f.path + "/supply-receive",
    acknowledgement(d.followups[0]),
  );
  await identity(page);
  await page.goto("/supply/changes");
  await expect(
    page.getByRole("heading", { name: "My quotation Supply referrals" }),
  ).toBeVisible();
  await page.goto("/" + f.path);
  await evidence(page);
  d = await conversionDetail(f.owner, f.id);
  await json(f.owner, f.path + "/receive", {
    ...receiving(d, d.preparation!.detail.owner_id!),
    decision: "Returned",
  });
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith(f.path) && r.request().method() === "GET",
    ),
    page.getByRole("button", { name: "Refresh current evidence" }).click(),
  ]);
  await expect(
    page.getByRole("button", { name: "Record Supply position review" }),
  ).toBeDisabled();
  await expect(
    page.getByLabel("Supply follow-up reason", { exact: true }),
  ).toHaveValue("SYN shared supply compared against corrected receiving");
  await page
    .getByRole("button", { name: "Use current Supply evidence" })
    .click();
  await page
    .getByLabel("Supply receiving decision", { exact: true })
    .selectOption("Returned");
  await submit(page, "Record Supply receiving decision", "supply-receive");
  expect((await conversionDetail(f.owner, f.id)).followups[0].status).toBe(
    "Returned",
  );
  await identity(page, "second-company");
  await page.goto("/" + f.path);
  await expect(
    page.getByRole("heading", { name: "6. Owned Supply follow-up" }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Supply follow-up evidence", { exact: true }),
  ).toHaveCount(0);
});

test("ES07 dependency native reservation reconciliation has separate review, retained holds and original lost-response recovery", async ({
  page,
}, info) => {
  const f = await reservationHttpFixture();
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  await page
    .getByLabel("Supply position decision")
    .selectOption("ReconcileReservationOutcome");
  await page
    .getByLabel("Evidenced reservation outcome")
    .selectOption("Confirmed");
  await page
    .getByLabel("Outcome observation time (UTC ISO ending Z)")
    .fill("2026-10-04T00:00:00.000Z");
  await page
    .getByLabel("Complete original-operation lookup evidence")
    .fill(
      "SYN complete original reservation lookup; reservation exists at source",
    );
  await submit(page, "Record Supply position review", "supply-review");
  let t = (await conversionDetail(f.owner, f.id)).followups[0];
  expect(t.reservation_dependencies[0].fact.id).toBe(f.unknown.id);
  await evidence(page);
  await page
    .getByText(new RegExp(`^Exact review ${t.review!.id}:`))
    .evaluate((n) => n.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: info.outputPath("reservation-review.png") });
  let sends = 0;
  let lost!: () => void;
  const committed = new Promise<void>((resolve) => {
    lost = resolve;
  });
  await page.route(`**/api/v1/${f.path}/supply-apply`, async (route) => {
    sends++;
    expect((await route.fetch()).ok()).toBe(true);
    await route.abort("failed");
    lost();
  });
  await page.getByRole("button", { name: "Apply exact Supply review" }).click();
  await committed;
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await saved(page);
  await page.unrouteAll({ behavior: "wait" });
  t = (await conversionDetail(f.owner, f.id)).followups[0];
  expect(sends).toBe(1);
  expect(t.events.filter((e) => e.action === "Apply")).toHaveLength(1);
  expect(t.reservation_dependencies[0].fact.predecessor_id).toBe(f.unknown.id);
  expect(t.reservation_dependencies[0].fact.data.state).toBe("Confirmed");
  expect(t.basis.position[0].usable_allocated).toBe("10");
  expect((await conversionDetail(f.owner, f.id)).dispositions[0].status).toBe(
    "Review required",
  );
  await expect(
    page.getByText("Allocation action holds", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Reassess completed-conversion disposition",
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page
    .getByText("Native reservation outcome dependencies", { exact: true })
    .evaluate((n) => n.scrollIntoView({ block: "start" }));
  await page.screenshot({
    path: info.outputPath("reservation-return-320.png"),
  });
});
