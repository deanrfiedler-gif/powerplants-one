import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { emptyHandover } from "../../src/sales/handover-model";
import { emptyReview } from "../../src/sales/aftercare-model";
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
async function captureSizes(
  page: Page,
  outputPath: (name: string) => string,
  scope: string,
) {
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
    const header = page.locator(".ppo-shell-header");
    if (await header.isVisible()) {
      const bounds = (await header.boundingBox())!;
      for (const control of await header.locator("button:visible").all()) {
        const rect = (await control.boundingBox())!;
        expect(
          rect.y + rect.height,
          "Header controls must not overlay page actions",
        ).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
      }
    }
    await page.screenshot({
      path: outputPath(`sales-${scope}-${width}.png`),
      fullPage: false,
    });
  }
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
  const worklistRead = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === "/api/v1/crm/opportunities" &&
      url.searchParams.get("q") === o.title &&
      response.request().method() === "GET"
    );
  });
  await page.goto(`/sales/opportunities${query}`);
  expect((await worklistRead).ok()).toBe(true);
  await expect(
    page.getByRole("link", { name: o.title, exact: true }).first(),
  ).toBeVisible();
  await page.locator(".crm-insights > summary").click();
  await expect(page.locator(".crm-insights")).toContainText("Unweighted");
  await captureSizes(page, info.outputPath.bind(info), "cr04");
  await page.setViewportSize({ width: 1440, height: 960 });
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
  await page.getByRole("tab", { name: "Overview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Scope & sites", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "Scope & sites", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await captureSizes(page, info.outputPath.bind(info), "cr01");
  await page.getByRole("link", { name: /Back to sales worklist/i }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/sales/opportunities" &&
      url.searchParams.get("q") === o.title,
  );
});
test("CR02 frozen submission survives clarification, acceptance and reload", async ({
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
  await captureSizes(page, info.outputPath.bind(info), "cr02");
  const intakeRead = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/sales/handovers?") &&
      response.request().method() === "GET",
  );
  await page.goto("/estimating/intake");
  expect((await intakeRead).ok()).toBe(true);
  await expect(
    page.locator(`a[href="/sales/handoffs/estimating/${id}"]`),
  ).toContainText(o.title);
  await page.goto("/sales/handoffs/won");
  await expect(page.getByRole("heading", { name: /Won/ })).toBeVisible();
});
test("CR03 Won receiving returns, corrects and accepts an exact successor while Due remains immutable", async ({
  page,
}, info) => {
  const o = await deal(page, `SYN Won receiving ${randomUUID()}`);
  let version = 1;
  for (const stage_id of ["Scoping", "Quoting", "Negotiation", "Closing"])
    await call(page, `crm/opportunities/${o.id}/stage`, {
      ...crmBase(),
      expected_version: version++,
      stage_id,
      qualification_note: null,
      identification_activity_id: null,
    });
  await call(page, `crm/opportunities/${o.id}/outcome`, {
    ...crmBase(),
    expected_version: version,
    close_outcome: "Won",
    lost_reason: null,
    acceptance_evidence: "SYN recorded acceptance; no conversion authority",
  });
  const original = (await call(page, `crm/opportunities/${o.id}`)).items[0];
  const id = randomUUID();
  await call(page, "sales/handovers", {
    ...crmBase(),
    id,
    opportunity_id: o.id,
    kind: "Won",
  });
  await call(page, `sales/handovers/${id}`, {
    ...crmBase(),
    expected_version: 1,
    action: "Save",
    receiving_owner_id: o.owner_id,
    note: "SYN exact receiving preparation",
    content: {
      ...emptyHandover(),
      problem: "SYN controls",
      outcome: "Usable controls",
      included_scope: "SYN installation",
      exclusions: "None",
      assumptions: "None",
      unknowns: "None",
      date_reason: "Customer date to be agreed",
      next_activity_id: o.initial_action.id,
      destination: "Projects",
      routing_basis: "SYN recorded owner direction",
      delivery_items: "SYN control panel",
      release_prerequisites:
        "Engineering release remains open; receiver owns follow-up",
    },
  });
  await page.goto(`/sales/handoffs/won/${id}`);
  await page
    .getByRole("tab", { name: "Review & clarification", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit exact revision", exact: true })
    .click();
  await page
    .getByLabel("Review, clarification or return reason")
    .fill("SYN clarify the selected installation boundary");
  await page
    .getByRole("button", { name: "Return with owned follow-up", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create successor revision", exact: true })
    .click();
  await page.getByRole("tab", { name: "Brief & scope", exact: true }).click();
  await page
    .getByLabel("Included scope", { exact: true })
    .fill("SYN corrected control panel installation boundary");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page
    .getByRole("tab", { name: "Review & clarification", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit exact revision", exact: true })
    .click();
  await page
    .getByLabel("Review, clarification or return reason")
    .fill("SYN exact corrected revision received; release still open");
  await page
    .getByRole("button", { name: "Accept exact revision", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Create successor revision",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Accepted", { exact: true }).first(),
  ).toBeVisible();
  await captureSizes(page, info.outputPath.bind(info), "cr03");
  const accepted = await call(page, `sales/handovers/${id}`);
  expect(accepted.record.revision).toBe(2);
  expect(accepted.record.content.release_prerequisites).toContain(
    "Engineering release remains open",
  );
  expect(accepted.history.map((e: { action: string }) => e.action)).toContain(
    "Return",
  );
  const final = (await call(page, `crm/opportunities/${o.id}`)).items[0];
  expect(original.handover_due.status).toBe("Due");
  expect(final.handover_due).toEqual(original.handover_due);
  expect(final.version).toBe(original.version);
});

test("CR05 issued source review saves attributed feedback, commercial preparation and guarded closure with responsive controls", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  // The projects share the one issued fixture and use deliberate corrections;
  // issuing the pack twice would try to confirm an already completed visit.
  const available = await call(page, "sales/aftercare");
  let id = available.items[0]?.record.id as string | undefined;
  if (!id) {
    const reportId =
      available.sources[0]?.id ?? (await reportIssued()).report.id;
    id = randomUUID();
    await call(page, "sales/aftercare", {
      ...crmBase(),
      id,
      source_report_id: reportId,
    });
  }
  let saved = await call(page, `sales/aftercare/${id}`);
  if (saved.record.state !== "Open") {
    await call(page, `sales/aftercare/${id}`, {
      ...crmBase(),
      expected_version: saved.record.version,
      action: "CorrectReview",
      data: {},
    });
    saved = await call(page, `sales/aftercare/${id}`);
  }
  await call(page, `sales/aftercare/${id}`, {
    ...crmBase(),
    expected_version: saved.record.version,
    action: "SaveReview",
    data: {
      review: {
        ...emptyReview(),
        due_detail:
          "SYN review date to be chosen explicitly in this correction",
      },
    },
  });
  const options = await call(page, `sales/aftercare/${id}/options`);
  expect(options.people.length).toBeGreaterThan(0);
  // Navigation can finish before the exact saved review reaches the browser.
  // Hold the real response beyond the unchanged UI assertion window so this
  // ordering is exercised on both viewports without retrying or replacing data.
  await page.route(`**/api/v1/sales/aftercare/${id}`, async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await route.fulfill({ response });
  }, { times: 1 });
  const reviewRead = page.waitForResponse((response) =>
    new URL(response.url()).pathname === `/api/v1/sales/aftercare/${id}` &&
    response.request().method() === "GET",
  );
  await page.goto(`/sales/aftercare/${id}`);
  const response = await reviewRead;
  expect(response.status()).toBe(200);
  expect(await response.finished()).toBeNull();
  expect((await response.json()).record.id).toBe(id);
  await expect(
    page.getByRole("tab", { name: "Customer review", exact: true }),
  ).toBeVisible();
  for (const tab of await page.getByRole("tab").all()) {
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }
  await page.getByRole("tab").first().click();
  await page.getByLabel("Review due date", { exact: true }).fill("2031-10-01");
  await page
    .getByLabel("Date choice / commitment / reason date needed", {
      exact: true,
    })
    .fill("SYN explicit customer choice; no automatic interval");
  await page
    .getByLabel("Customer review date", { exact: true })
    .fill("2026-09-24");
  await page
    .getByLabel("Review method and evidence limits", { exact: true })
    .fill("SYN customer telephone statements; no competence assessment");
  await page
    .getByRole("button", { name: "Add participant", exact: true })
    .click();
  await page
    .getByLabel("Participant", { exact: true })
    .selectOption(options.people[0].id);
  await page
    .getByLabel("Recorded role (does not imply signing authority)", {
      exact: true,
    })
    .fill("SYN participant; signing authority not established");
  await page.getByRole("button", { name: "Add feedback", exact: true }).click();
  await page
    .getByLabel("Speaker / attributed person", { exact: true })
    .selectOption(options.people[0].id);
  const statement =
    "SYN customer reports the controls are usable in the observed configuration; this statement does not establish competence or purchasing authority. "
      .repeat(8)
      .trim();
  await page
    .getByLabel("Statement and context", { exact: true })
    .fill(statement);
  await page
    .getByLabel("Agreed next steps (or explicitly None)", { exact: true })
    .fill("None");
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await page
    .getByRole("button", { name: "Refresh review preparation", exact: true })
    .click();
  const aftercarePath = `/api/v1/sales/aftercare/${id}`;
  const completedPattern = `**${aftercarePath}`;
  // CompleteReview acknowledges the command before its separate saved-record
  // refresh. Exercise that ordering with the real response beyond the unchanged
  // render assertion window; no receipt or record content is substituted.
  await page.route(completedPattern, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    if (response.ok() && (await response.json()).record?.state === "ReviewCompleted")
      await new Promise((resolve) => setTimeout(resolve, 6000));
    await route.fulfill({ response });
  });
  const completionResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === aftercarePath &&
      response.request().method() === "POST" &&
      response.request().postDataJSON()?.action === "CompleteReview",
  );
  const completedRead = page.waitForResponse(async (response) => {
    if (
      new URL(response.url()).pathname !== aftercarePath ||
      response.request().method() !== "GET"
    )
      return false;
    if (!response.ok()) return true;
    return (await response.json()).record?.state === "ReviewCompleted";
  });
  await page
    .getByRole("button", { name: "Complete customer review", exact: true })
    .click();
  const completion = await completionResponse;
  expect(completion.ok()).toBe(true);
  const completionReceipt = await completion.json();
  expect(completionReceipt).toMatchObject({ record_id: id, state: "ReviewCompleted" });
  const completed = await completedRead;
  expect(completed.ok()).toBe(true);
  expect((await completed.json()).record).toMatchObject({
    id,
    state: "ReviewCompleted",
    version: completionReceipt.record_version,
  });
  await page.unroute(completedPattern);
  await expect(
    page.getByRole("button", { name: "Open correction", exact: true }),
  ).toBeVisible();
  expect(
    (await call(page, `sales/aftercare/${id}`)).record.content.review
      .feedback[0].statement,
  ).toBe(statement);
  await page
    .getByRole("tab", { name: "Maintenance & renewal", exact: true })
    .click();
  await page
    .locator("summary")
    .filter({ hasText: /^Prepare commercial discussion$/ })
    .press("Enter");
  await page
    .getByLabel("Source observation and evidence", { exact: true })
    .fill("SYN customer review recorded");
  await page
    .getByLabel("Identified customer need", { exact: true })
    .fill("SYN explore a later controls review");
  await page
    .getByLabel("Unresolved assumptions", { exact: true })
    .fill("No renewal authority or agreement terms adopted");
  await page
    .getByLabel("I reviewed the permitted existing-opportunity source", {
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Prepare commercial discussion", exact: true })
    .click();
  await page.getByRole("tab", { name: "Customer review", exact: true }).click();
  const closureResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === aftercarePath &&
      response.request().method() === "POST" &&
      response.request().postDataJSON()?.action === "Close",
  );
  // The Close receipt is followed by a separate resource refresh. A poll of
  // the previous revision is not proof that the saved closure reached the UI.
  const closedRead = page.waitForResponse(async (response) => {
    if (
      new URL(response.url()).pathname !== aftercarePath ||
      response.request().method() !== "GET"
    )
      return false;
    if (!response.ok()) return true;
    return (await response.json()).record?.state === "Closed";
  });
  await page
    .getByRole("button", { name: "Close aftercare record", exact: true })
    .click();
  const closure = await closureResponse;
  expect(closure.ok()).toBe(true);
  const receipt = await closure.json();
  expect(receipt).toMatchObject({ record_id: id, state: "Closed" });
  const refreshed = await closedRead;
  expect(refreshed.ok()).toBe(true);
  expect((await refreshed.json()).record).toMatchObject({
    id,
    state: "Closed",
    version: receipt.record_version,
  });
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  // Document load does not include the asynchronous record read. Observe the
  // reload's exact GET and saved version before starting the UI assertion;
  // neither the action timeout nor the five-second render budget is changed.
  const reloadedRead = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === aftercarePath &&
      response.request().method() === "GET",
  );
  await page.reload();
  const reloaded = await reloadedRead;
  expect(reloaded.ok()).toBe(true);
  const persisted = await reloaded.json();
  expect(persisted.record).toMatchObject({
    id,
    state: "Closed",
    version: receipt.record_version,
  });
  expect(persisted.record.content.review.feedback[0].statement).toBe(statement);
  await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
  await captureSizes(page, info.outputPath.bind(info), "cr05");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    "BODY",
  );
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page.screenshot({
    path: info.outputPath("sales-cr05-200-percent-css-zoom.png"),
    fullPage: false,
  });
});
