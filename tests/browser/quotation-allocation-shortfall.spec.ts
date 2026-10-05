import { test, expect, type Page } from "@playwright/test";
import {
  shortfallHttpFixture as fixture,
  conversionDetail,
} from "../helpers/quotation-allocation-shortfall-http";
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

test("ES07 allocation desktop/mobile exact independent receiving and separate atomic native application", async ({
  page,
}, info) => {
  const f = await fixture();
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  const t = await f.current();
  for (const a of t.allocation_shortfall.candidates[0].group.allocations)
    await page
      .getByLabel(`New quantity for allocation ${a.id}`, { exact: true })
      .fill(a.demand_id === t.target_id ? "0" : "4.375001");
  await submit(
    page,
    "Propose exact allocation reductions",
    "shortfall-propose",
  );
  await expect(
    page.getByRole("button", {
      name: "Review independently received reductions",
      exact: true,
    }),
  ).toBeDisabled();
  for (const r of (await f.current()).allocation_shortfall.required) {
    await evidence(page);
    await submit(
      page,
      `Record allocation decision for ${r.demand.reference}`,
      "shortfall-receive",
    );
  }
  await evidence(page);
  await submit(
    page,
    "Review independently received reductions",
    "supply-review",
  );
  await evidence(page);
  await submit(page, "Apply exact Supply review", "supply-apply");
  await expect(
    page.getByRole("heading", {
      name: "Completed allocation proposal and retained receiving",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Record allocation decision for / }),
  ).toHaveCount(0);
  const after = await f.current();
  expect(after.outcome!.decision).toBe("ReduceAllocations");
  expect(after.basis.position[0].usable_allocated).toBe("4.375001");
  expect(after.basis.conversion.target.quantity).toBe("2");
  expect(
    after.allocation_shortfall.effects!.demands.some(
      (d) => d.unmet === "3.624999",
    ),
  ).toBe(true);
  expect((await conversionDetail(f.owner, f.id)).dispositions[0].status).toBe(
    "Review required",
  );
  await page
    .getByRole("heading", {
      name: "Resolve shared Shipment allocation shortfall",
      exact: true,
    })
    .evaluate((n) => n.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: info.outputPath("allocation-shortfall.png") });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("allocation-shortfall-320.png"),
  });
});
test("ES07 allocation committed lost response recovers the original through reload with one atomic native effect", async ({
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
  expect(t.events.filter((e) => e.action === "Apply")).toHaveLength(2);
  expect(t.outcome!.decision).toBe("ReduceAllocations");
  expect(t.basis.position[0].usable_allocated).toBe("4.375001");
});
test("ES07 allocation inconclusive unsent original blocks replacement and exact retry retains original content", async ({
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
    (await conversionDetail(f.owner, f.id)).followups[0].basis.position[0]
      .usable_allocated,
  ).toBe("4.375001");
});
