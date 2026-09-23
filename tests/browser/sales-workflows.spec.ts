import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { emptyHandover } from "../../src/sales/handover-model";
import { reportIssued } from "../helpers/reports";
import { closeDatabase } from "../../src/platform/database";
test.describe.configure({ timeout: 120000 });
test.beforeAll(() => {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
});
test.afterAll(closeDatabase);
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
async function deal(page: Page, title: string) {
  await call(page, "local-session", { profile: "coordinator" });
  const o = { ...crmDiscovery(), title };
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  await call(page, "crm/opportunities", o);
  return o;
}
test("CR01/04 scoped insights drill through eight workspace views and preserve worklist context", async ({
  page,
}, info) => {
  const o = await deal(page, `SYN Sales workspace ${randomUUID()}`),
    query = `?pipeline_definition_id=${o.pipeline_definition_id}&q=${encodeURIComponent(o.title)}&view=list`;
  await page.goto(`/sales/opportunities${query}`);
  await expect(
    page.getByRole("link", { name: o.title, exact: true }).first(),
  ).toBeVisible();
  await page.locator(".crm-insights > summary").click();
  await expect(page.locator(".crm-insights")).toContainText("Unweighted");
  await page.screenshot({
    path: info.outputPath("sales-cr04-insights.png"),
    fullPage: false,
  });
  await page.getByRole("link", { name: o.title, exact: true }).first().click();
  for (const name of [
    "Overview",
    "Scope & sites",
    "Activities",
    "Tasks",
    "Estimates & quotations",
    "Correspondence",
    "Documents",
    "History",
  ]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 960 : width === 1024 ? 768 : 844,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`sales-cr01-${width}.png`),
      fullPage: false,
    });
  }
  await page.getByRole("link", { name: /Back to sales worklist/i }).click();
  expect(new URL(page.url()).searchParams.get("q")).toBe(o.title);
});
test("CR02 frozen submission survives clarification, reload and source drift; CR03 due worklist remains separate", async ({
  page,
}, info) => {
  const o = await deal(page, `SYN Exact Sales intake ${randomUUID()}`),
    id = randomUUID();
  await call(page, "sales/handovers", {
    ...crmBase(),
    id,
    opportunity_id: o.id,
    kind: "Estimating",
  });
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    expected_version: 1,
    action: "Save",
    receiving_owner_id: o.owner_id,
    note: "SYN exact saved brief",
    content: {
      ...emptyHandover(),
      problem: "SYN problem",
      outcome: "Customer outcome",
      included_scope: "Controls scope",
      exclusions: "None",
      assumptions: "None",
      unknowns: "None",
      date_reason: "Customer to choose",
      next_activity_id: o.initial_action.id,
    },
  });
  await page.goto(`/sales/handoffs/estimating/${id}`);
  await page.getByRole("tab", { name: "Review & clarification" }).click();
  await page.getByRole("button", { name: "Submit exact revision" }).click();
  await expect(
    page.getByRole("button", { name: "Request clarification" }),
  ).toBeVisible();
  await page
    .getByLabel("Review, clarification or return reason")
    .fill("SYN confirm customer date basis");
  await page.getByRole("button", { name: "Request clarification" }).click();
  await expect(
    page.getByRole("button", { name: "Answer clarification" }),
  ).toBeVisible();
  await page
    .getByLabel("Review, clarification or return reason")
    .fill("SYN date remains a customer choice");
  await page.getByRole("button", { name: "Answer clarification" }).click();
  await page.getByRole("button", { name: "Resolve reviewed answer" }).click();
  await page.getByRole("button", { name: "Accept exact revision" }).click();
  await expect(
    page.getByRole("button", { name: "Create successor revision" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Accepted", { exact: true }).first(),
  ).toBeVisible();
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 960 : width === 1024 ? 768 : 844,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`sales-cr02-${width}.png`),
      fullPage: false,
    });
  }
  await page.goto("/estimating/intake");
  await expect(
    page.locator(`a[href="/sales/handoffs/estimating/${id}"]`),
  ).toContainText(o.title);
  await page.goto("/sales/handoffs/won");
  await expect(page.getByRole("heading", { name: /Won/ })).toBeVisible();
});
test("CR05 issued source review exposes policy unknowns, all follow-up views and responsive keyboard controls", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  // This view-only case can share a native issued record with the other browser
  // project or HTTP proof. The pack helper owns one seeded appointment; issuing
  // it twice would incorrectly try to confirm a completed visit.
  const available = await call(page, "sales/aftercare");
  let id = available.items[0]?.record.id as string | undefined;
  if (!id) {
    const reportId = available.sources[0]?.id ?? (await reportIssued()).report.id;
    id = randomUUID();
    await call(page, "sales/aftercare", {
      ...crmBase(), id, source_report_id: reportId,
    });
  }
  await page.goto(`/sales/aftercare/${id}`);
  await expect(
    page.getByRole("tab", { name: "Customer review", exact: true }),
  ).toBeVisible();
  for (const tab of await page.getByRole("tab").all()) {
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }
  await page.getByRole("tab").first().click();
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({
      width,
      height: width === 1440 ? 960 : width === 1024 ? 768 : 844,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`sales-cr05-${width}.png`),
      fullPage: false,
    });
  }
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    "BODY",
  );
  await page.setViewportSize({ width: 720, height: 480 });
  await page.screenshot({
    path: info.outputPath("sales-cr05-200-percent-equivalent.png"),
    fullPage: false,
  });
});
