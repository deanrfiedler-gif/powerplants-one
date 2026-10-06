import { test, expect, type Page } from "@playwright/test";
import {
  materialHttpFixture,
  conversionDetail,
} from "../helpers/quotation-material-resolution-http";
const fixture = (reviewed = false) =>
  materialHttpFixture(reviewed, false, false, false, true);
test.describe.configure({ timeout: 120000 });
async function identity(page: Page) {
  await page.goto("/work");
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(page.url()).origin },
        data: { profile: "coordinator" },
      })
    ).ok(),
  ).toBe(true);
}
async function evidence(page: Page) {
  await page
    .getByLabel("Supply follow-up reason", { exact: true })
    .fill("SYN unsupported internal Project forecast reviewed");
  await page
    .getByLabel("Supply follow-up evidence", { exact: true })
    .fill(
      "SYN exact Project, Demand, Impact, MaterialAction and source evidence",
    );
  await page.getByLabel("Supply synthetic boundary").selectOption("yes");
}
async function saved(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Saved to the server" }),
  ).toBeVisible();
  const [detail] = await Promise.all([
    page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname ===
          "/api/v1" + new URL(page.url()).pathname &&
        r.request().method() === "GET",
    ),
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Open saved receiving" }).click(),
  ]);
  expect(detail.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      name: "Resolve the affected Project forecast",
      exact: true,
    }),
  ).toBeVisible();
}
async function submit(page: Page, label: string, action: string) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/conversion/" + action) &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: label, exact: true }).click(),
  ]);
  expect(response.status()).toBe(200);
  await saved(page);
}
test("ES07 merge desktop/mobile receives six effects and separately withdraws native dates while unmet Demand remains", async ({
  page,
}, info) => {
  const f = await fixture();
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  await page
    .getByLabel("Merge task C dependent on both A and B", { exact: true })
    .selectOption(f.mergeSuccessor!.id);
  await page
    .getByLabel("Retained predecessor B whose forecast remains unchanged", {
      exact: true,
    })
    .selectOption(f.mergePredecessor!.id);
  await submit(page, "Propose exact forecast withdrawal", "material-propose");
  await evidence(page);
  await page
    .getByLabel("Material resolution review", { exact: true })
    .selectOption("WithdrawForecast");
  await expect(
    page.getByRole("button", { name: "Freeze material review", exact: true }),
  ).toBeDisabled();
  for (const role of [
    "Demand",
    "Project",
    "Task",
    "MaterialAction",
    "Retained predecessor B",
    "Merge task C",
  ]) {
    await evidence(page);
    await page
      .getByLabel(`${role} receiving decision`, { exact: true })
      .selectOption("Accepted");
    await submit(page, `Record ${role} decision`, "material-receive");
  }
  await evidence(page);
  await page
    .getByLabel("Material resolution review", { exact: true })
    .selectOption("WithdrawForecast");
  await submit(page, "Freeze material review", "material-review");
  await evidence(page);
  await submit(page, "Apply reviewed material outcome", "material-apply");
  await expect(
    page.getByRole("heading", {
      name: "Returned material outcome",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Completed receiving evidence",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /^Record (Demand|Project|Task|MaterialAction|Retained predecessor B|Merge task C) decision$/,
    }),
  ).toHaveCount(0);
  const s = (await f.current()).material_resolution;
  expect(s.applied!.native_receipts).toHaveLength(3);
  expect(s.dependencies!.unmet).toBe("3.624999");
  expect(s.dependencies!.project.task.start_date).toBe(null);
  expect(s.dependencies!.project.mergeSuccessor!.start_date).toBe(null);
  expect(s.dependencies!.project.mergeSuccessor!.dependencies).toEqual(
    [
      { task_id: f.task.id, kind: "FS" },
      { task_id: f.mergePredecessor!.id, kind: "SS" },
    ].sort((a, b) => a.task_id.localeCompare(b.task_id)),
  );
  expect(s.dependencies!.project.retainedPredecessor).toEqual(
    s.proposal!.dependencies.project.retainedPredecessor,
  );
  await expect(
    page.getByText("No B save, version increment or schedule event.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(s.dependencies!.activity.state).not.toBe("Completed");
  await page
    .getByRole("heading", {
      name: "Resolve the affected Project forecast",
      exact: true,
    })
    .evaluate((n) => n.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: info.outputPath("task-merge.png") });
  await page.setViewportSize({ width: 320, height: 740 });
  await page
    .getByRole("heading", {
      name: "Resolve the affected Project forecast",
      exact: true,
    })
    .evaluate((n) => n.scrollIntoView({ block: "start" }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("task-merge-320.png"),
  });
});
test("ES07 merge lost committed response recovers exact atomic original after reload", async ({
  page,
}) => {
  const f = await fixture(true);
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  let sends = 0,
    operation = "",
    lost!: () => void;
  const committed = new Promise<void>((r) => {
    lost = r;
  });
  await page.route(`**/api/v1/${f.path}/material-apply`, async (route) => {
    sends++;
    operation = route.request().postDataJSON().operation_id;
    expect((await route.fetch()).ok()).toBe(true);
    await route.abort("failed");
    lost();
  });
  await page
    .getByRole("button", {
      name: "Apply reviewed material outcome",
      exact: true,
    })
    .click();
  await committed;
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Propose exact forecast withdrawal" }),
  ).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  const [detail, receipt] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/v1/${f.path}`) &&
        r.request().method() === "GET",
    ),
    page.waitForResponse((r) =>
      r.url().endsWith(`/api/v1/operations/${operation}`),
    ),
    page.reload(),
  ]);
  expect(detail.status()).toBe(200);
  expect(receipt.status()).toBe(200);
  await saved(page);
  await page.unrouteAll({ behavior: "wait" });
  expect(sends).toBe(1);
  const s = (await conversionDetail(f.owner, f.id)).followups[0]
    .material_resolution;
  expect(s.events.filter((e) => e.action === "MaterialApply")).toHaveLength(
    1,
  );
  expect(s.applied!.native_receipts).toHaveLength(3);
});
test("ES07 merge inconclusive unsent lookup blocks replacement and retries the unchanged original", async ({
  page,
}) => {
  const f = await fixture(true);
  await identity(page);
  await page.goto("/" + f.path);
  await evidence(page);
  let original = "";
  await page.route(`**/api/v1/${f.path}/material-apply`, async (route) => {
    original = route.request().postData()!;
    await route.abort("failed");
  });
  await page.route("**/api/v1/operations/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "SYN inconclusive lookup",
      }),
    }),
  );
  await page
    .getByRole("button", {
      name: "Apply reviewed material outcome",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolve the original action" }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  const [detail, receipt] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/v1/${f.path}`) &&
        r.request().method() === "GET",
    ),
    page.waitForResponse((r) =>
      r
        .url()
        .endsWith(`/api/v1/operations/${JSON.parse(original).operation_id}`),
    ),
    page.reload(),
  ]);
  expect(detail.status()).toBe(200);
  expect(receipt.status()).toBe(503);
  await expect(
    page.getByRole("button", { name: "Propose exact forecast withdrawal" }),
  ).toBeDisabled();
  await page.unrouteAll({ behavior: "wait" });
  let retried = "";
  await page.route(`**/api/v1/${f.path}/material-apply`, async (route) => {
    retried = route.request().postData()!;
    await route.continue();
  });
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith(f.path + "/material-apply") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Retry exact original" }).click(),
  ]);
  expect(response.status()).toBe(200);
  await saved(page);
  expect(retried).toBe(original);
  expect(
    (await f.current()).material_resolution.applied!.native_receipts,
  ).toHaveLength(3);
});
