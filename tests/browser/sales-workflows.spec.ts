import { test, expect, type Page, type Request, type Response } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { emptyHandover } from "../../src/sales/handover-model";
import { emptyReview } from "../../src/sales/aftercare-model";
import { reportIssued } from "../helpers/reports";
import { closeDatabase } from "../../src/platform/database";
import { aftercareReadDiagnostics } from "../helpers/aftercare-read-diagnostics";
import { currentResourceRead } from "../helpers/current-resource-read";
test.describe.configure({ timeout: 120000 });
test.beforeAll(() => {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
});
test.afterAll(closeDatabase);
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:3000").origin },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
function handoverStateRead(page: Page, id: string, state: string) {
  return page.waitForResponse(async response => {
    if (new URL(response.url()).pathname !== `/api/v1/sales/handovers/${id}` || response.request().method() !== "GET") return false;
    return !response.ok() || (await response.json()).record.state === state;
  });
}
async function aftercareRecordId(page: Page) {
  // The projects share the issued fixture; issuing it twice would confirm an
  // already completed visit. Each review correction remains explicit below.
  const available = await call(page, "sales/aftercare");
  let id = available.items[0]?.record.id as string | undefined;
  if (!id) {
    const reportId = available.sources[0]?.id ?? (await reportIssued()).report.id;
    id = randomUUID();
    await call(page, "sales/aftercare", { ...crmBase(), id, source_report_id: reportId });
  }
  return id;
}
async function captureSizes(
  page: Page,
  outputPath: (name: string) => string,
  scope: string,
) {
  const originalViewport = page.viewportSize();
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
  if (originalViewport) await page.setViewportSize(originalViewport);
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
  // CR-04 D13/Q1: phone actions live in the Choose view sheet.
  const chooser = page.getByRole("button", { name: /^Choose view\. Current view:/ });
  if (await chooser.isVisible()) await chooser.click();
  await page.getByRole("button", { name: "Pipeline insights", exact: true })
    .filter({ visible: true }).click();
  await page.locator(".crm-insights > summary").click();
  await expect(page.locator(".crm-insights")).toContainText("Unweighted");
  await captureSizes(page, info.outputPath.bind(info), "cr04");
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.getByRole("button", { name: "Close Pipeline insights", exact: true }).click();
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
  // This journey now includes the queue, a draft successor, exact historical entry and both preparation lists.
  // Keep the five-second render assertions; allow the expanded end-to-end journey three minutes.
  test.setTimeout(180000);
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
  const acceptedRead = handoverStateRead(page, id, "Accepted");
  await page.getByRole("button", { name: "Accept exact revision" }).click();
  expect((await acceptedRead).ok()).toBe(true);
  await expect(
    page.getByRole("button", { name: "Create successor revision" }),
  ).toBeVisible();
  const reloadedRead = handoverStateRead(page, id, "Accepted");
  await page.reload();
  expect((await reloadedRead).ok()).toBe(true);
  await expect(
    page.getByText("Accepted", { exact: true }).first(),
  ).toBeVisible();
  await captureSizes(page, info.outputPath.bind(info), "cr02");
  const intakeRead = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/sales/handovers/receiving") &&
      response.request().method() === "GET",
  );
  await page.goto("/estimating/intake");
  expect((await intakeRead).ok()).toBe(true);
  const queue = page.locator("#ppo-sales-briefs");
  const brief = info.project.use.isMobile ? queue.locator(".sb-phone-row").filter({hasText:o.title}).getByRole("button") : queue.getByRole("button",{name:o.title,exact:true});
  await brief.click();
  const snapshot=page.getByRole("dialog",{name:"Submitted Sales brief snapshot"});
  await expect(snapshot.getByRole("link",{name:"Open brief",exact:true})).toHaveAttribute("href",`/sales/handoffs/estimating/${id}?revision=1`);
  await snapshot.getByRole("button",{name:"Close brief snapshot"}).click();
  const accepted = await call(page, `sales/handovers/${id}`);
  await call(page, `sales/handovers/${id}`, {...crmBase(), action:"Successor",expected_version:accepted.record.version,note:"SYN successor stays separate"});
  const successor = await call(page, `sales/handovers/${id}`);
  await call(page, `sales/handovers/${id}`, {...crmBase(), action:"Save",expected_version:successor.record.version,content:{...successor.record.content,problem:"SYN newer unsubmitted content"},receiving_owner_id:null,note:"SYN saved draft only"});
  const historicalRead = handoverStateRead(page, id, "Draft");
  await page.goto(`/sales/handoffs/estimating/${id}?revision=1`);
  expect((await historicalRead).ok()).toBe(true);
  await expect(page.getByRole("heading",{name:"Submitted Sales brief · revision 1"})).toBeVisible();
  await expect(page.getByText("SYN problem",{exact:true})).toBeVisible();
  await expect(page.getByText("SYN newer unsubmitted content",{exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Accept exact revision"})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Review the current brief separately"})).toHaveAttribute("href",`/sales/handoffs/estimating/${id}`);
  const preparationRead = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/sales/handovers" && response.request().method() === "GET");
  await page.goto("/sales/handoffs/estimating");
  expect((await preparationRead).ok()).toBe(true);
  await expect(page.locator(`a[href="/sales/handoffs/estimating/${id}"]`)).toContainText(o.title);
  await page.goto("/sales/handoffs/won");
  await expect(page.getByRole("heading", { name: /Won/ })).toBeVisible();
});
test("CR03 Won receiving returns, corrects and accepts an exact successor while Due remains immutable", async ({
  page,
}, info) => {
  // Includes the existing Won list read after the receiving cycle and viewport captures.
  test.setTimeout(180000);
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
  const acceptedRead = handoverStateRead(page, id, "Accepted");
  await page
    .getByRole("button", { name: "Accept exact revision", exact: true })
    .click();
  expect((await acceptedRead).ok()).toBe(true);
  await expect(
    page.getByRole("button", {
      name: "Create successor revision",
      exact: true,
    }),
  ).toBeVisible();
  const reloadedRead = handoverStateRead(page, id, "Accepted");
  await page.reload();
  expect((await reloadedRead).ok()).toBe(true);
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
  const wonListRead = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/sales/handovers" && response.request().method() === "GET");
  await page.goto("/sales/handoffs/won");
  expect((await wonListRead).ok()).toBe(true);
  await expect(page.locator(`a[href="/sales/handoffs/won/${id}"]`)).toContainText(o.title);
});

test("CR05 issued source review saves attributed feedback, commercial preparation and guarded closure with responsive controls", async ({
  page,
}, info) => {
  // A passing run takes about 90 seconds, too close to the default 120 under CI load.
  test.setTimeout(180000);
  await call(page, "local-session", { profile: "coordinator" });
  const id = await aftercareRecordId(page);
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
  const readiness = await aftercareReadDiagnostics(page, info, `/api/v1/sales/aftercare/${id}`);
  const currentRead = currentResourceRead(page, `/api/v1/sales/aftercare/${id}`);
  let heldRequest: Request | undefined;
  // Navigation can finish before the exact saved review reaches the browser.
  // Hold the real response beyond the unchanged UI assertion window so this
  // ordering is exercised on both viewports without retrying or replacing data.
  await page.route(`**/api/v1/sales/aftercare/${id}`, async (route) => {
    heldRequest = route.request();
    readiness.mark("held-route-entered", route.request());
    const response = await route.fetch();
    readiness.mark("held-upstream-response", route.request(), response.status());
    await new Promise((resolve) => setTimeout(resolve, 6000));
    readiness.mark("held-delay-completed", route.request());
    await route.fulfill({ response });
    readiness.mark("held-route-fulfilled", route.request());
  }, { times: 1 });
  const reviewRead = page.waitForResponse((response) =>
    new URL(response.url()).pathname === `/api/v1/sales/aftercare/${id}` &&
    response.request().method() === "GET" && response.request() === heldRequest,
  );
  try {
    await page.goto(`/sales/aftercare/${id}`);
    const response = await reviewRead;
    readiness.mark("test-matched-response", response.request(), response.status());
    expect(response.status()).toBe(200);
    expect(await response.finished()).toBeNull();
    expect((await response.json()).record.id).toBe(id);
    // A focus/poll read can supersede the held response. Preserve the response
    // checks and start the same render deadline after the current read finishes.
    const current = await currentRead.finished();
    expect(current.status()).toBe(200);
    expect((await current.json()).record.id).toBe(id);
    readiness.mark("current-read-completed", current.request(), current.status());
    readiness.mark("tab-assertion-started");
    await expect(
      page.getByRole("tab", { name: "Customer review", exact: true }),
    ).toBeVisible();
    readiness.mark("tab-assertion-passed");
  } finally {
    currentRead.dispose();
    await readiness.finish();
  }
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
  // Every completed read waits at one barrier, released 6 seconds after the
  // receipt arrives, so no overlapping focus or interval read can deliver the
  // saved record early. Each held handler had its own timer before, and some
  // were still asleep when the route was removed, fulfilling routes already
  // handled and delivering stale reads after the page had moved on.
  let releaseCompletedReads: () => void = () => {};
  const completedReadsReleased = new Promise<void>((resolve) => {
    releaseCompletedReads = resolve;
  });
  let receiptObservedAt = 0;
  let completedReadsReleasedAt = 0;
  await page.route(completedPattern, async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const response = await route.fetch();
    if (response.ok() && (await response.json()).record?.state === "ReviewCompleted")
      await completedReadsReleased;
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
  let completionReceipt!: { record_version?: number };
  let completed!: Response;
  try {
    await page
      .getByRole("button", { name: "Complete customer review", exact: true })
      .click();
    const completion = await completionResponse;
    expect(completion.ok()).toBe(true);
    completionReceipt = await completion.json();
    expect(completionReceipt).toMatchObject({ record_id: id, state: "ReviewCompleted" });
    receiptObservedAt = Date.now();
    setTimeout(function releaseAfterHold() {
      if (completedReadsReleasedAt) return;
      const now = Date.now();
      const remaining = 6000 - (now - receiptObservedAt);
      if (remaining > 0) {
        setTimeout(releaseAfterHold, remaining);
        return;
      }
      completedReadsReleasedAt = now;
      releaseCompletedReads();
    }, 6000);
    completed = await completedRead;
  } finally {
    // Bounded: a failure above never leaves a completed read held.
    if (!completedReadsReleasedAt) {
      completedReadsReleasedAt = Date.now();
      releaseCompletedReads();
    }
  }
  // The saved record reached the browser only after the receipt and the hold.
  expect(receiptObservedAt).toBeGreaterThan(0);
  expect(completedReadsReleasedAt - receiptObservedAt).toBeGreaterThanOrEqual(6000);
  expect(completed.ok()).toBe(true);
  expect((await completed.json()).record).toMatchObject({
    id,
    state: "ReviewCompleted",
    version: completionReceipt.record_version,
  });
  // The earlier held read was registered with { times: 1 }, so this removes only
  // the completed-read route, after any handler still running has finished.
  await page.unrouteAll({ behavior: "wait" });
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

test("CR05 a superseded success cannot start the current-read render deadline", async ({ page }, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const id = await aftercareRecordId(page), path = `/api/v1/sales/aftercare/${id}`;
  // Use a real permitted synthetic record as the transport fixture. This case
  // controls response order only; the journey above still fetches each real GET
  // and the CRM revocation case separately proves actual permission removal.
  const fixture = await page.request.get(path);
  expect(fixture.status()).toBe(200);
  expect((await fixture.json()).record.id).toBe(id);
  const initialSeen = Promise.withResolvers<void>(), newerSeen = Promise.withResolvers<void>();
  const releaseInitial = Promise.withResolvers<void>(), releaseNewer = Promise.withResolvers<void>();
  const readiness = await aftercareReadDiagnostics(page, info, path);
  const currentRead = currentResourceRead(page, path);
  let count = 0;
  await page.route(`**${path}`, async route => {
    if (++count === 1) {
      initialSeen.resolve();
      await releaseInitial.promise;
    } else {
      newerSeen.resolve();
      await releaseNewer.promise;
    }
    await route.fulfill({ response: fixture });
  });
  try {
    await page.goto(`/sales/aftercare/${id}`);
    await initialSeen.promise;
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await newerSeen.promise;
    let settled = false;
    const ready = currentRead.finished();
    void ready.then(() => { settled = true; }, () => { settled = true; });
    const obsolete = page.waitForResponse(response =>
      new URL(response.url()).pathname === path && response.request().method() === "GET");
    releaseInitial.resolve();
    const response = await obsolete;
    expect(response.status()).toBe(200);
    expect(await response.finished()).toBeNull();
    expect((await response.json()).record.id).toBe(id);
    readiness.mark("superseded-response-completed", response.request(), response.status());
    const obsoleteAssertion = expect(page.getByRole("tab", { name: "Customer review", exact: true }))
      .toBeVisible().then(() => false, (error: unknown) => {
        if (!(error instanceof Error) || !error.message.includes("toBeVisible")) throw error;
        readiness.mark("obsolete-tab-assertion-failed");
        return true;
      });
    // Recreate the old gate's failure condition: six seconds after a complete
    // valid HTTP 200, the latest read is pending and the tab is correctly absent.
    await new Promise(resolve => setTimeout(resolve, 6000));
    expect(await obsoleteAssertion, "the former gate must reproduce its premature visibility failure").toBe(true);
    expect(settled, "the obsolete success must not complete current-read readiness").toBe(false);
    await expect(page.getByRole("status").filter({ hasText: /^Loading aftercare review…$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Customer review", exact: true })).toHaveCount(0);
    readiness.mark("superseded-response-still-loading");
    releaseNewer.resolve();
    const current = await ready;
    expect(current.status()).toBe(200);
    expect((await current.json()).record.id).toBe(id);
    readiness.mark("current-read-completed", current.request(), current.status());
    readiness.mark("tab-assertion-started");
    await expect(page.getByRole("tab", { name: "Customer review", exact: true })).toBeVisible();
    readiness.mark("tab-assertion-passed");
  } finally {
    releaseInitial.resolve();
    releaseNewer.resolve();
    await page.unrouteAll({ behavior: "wait" });
    currentRead.dispose();
    await readiness.finish();
    await fixture.dispose();
  }
});
