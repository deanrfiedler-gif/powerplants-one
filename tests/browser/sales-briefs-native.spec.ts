import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { emptyHandover } from "../../src/sales/handover-model";

test("CR-02 native receiving queue retains the submitted revision and exact handovers through a draft successor", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(180000);
  const origin = new URL(test.info().project.use.baseURL!).origin;
  async function call(path: string, body?: unknown) {
    const response = await page.request.fetch("/api/v1/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { Origin: origin },
      data: body,
    });
    expect(response.ok(), await response.text()).toBe(true);
    return response.json();
  }
  await call("local-session", { profile: "coordinator" });
  const opportunity = crmDiscovery();
  opportunity.title = "SYN Native receiving queue " + randomUUID();
  opportunity.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  opportunity.initial_action.due_needed = false;
  await call("crm/opportunities", opportunity);
  const id = randomUUID(),
    path = "sales/handovers/" + id;
  await call("sales/handovers", {
    ...crmBase(),
    id,
    opportunity_id: opportunity.id,
    kind: "Estimating",
  });
  const content = {
    ...emptyHandover(),
    problem: "SYN frozen submitted native brief",
    outcome: "SYN customer outcome",
    included_scope: "SYN controls scope",
    exclusions: "None",
    assumptions: "None",
    unknowns: "SYN shutdown date to confirm",
    date_reason: "Customer to choose",
    next_activity_id: opportunity.initial_action.id,
  };
  await call(path, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: opportunity.owner_id,
    note: "SYN preparation",
  });
  await call(path, {
    ...crmBase(),
    action: "Submit",
    expected_version: 2,
    note: "SYN exact submission",
  });
  const queue = page.locator("#ppo-sales-briefs");
  const queueUrl =
    "/estimating/intake?" + new URLSearchParams({ q: opportunity.title });
  async function readQueue(state: string) {
    const read = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/v1/sales/handovers/receiving" &&
        response.request().method() === "GET",
    );
    await page.goto(queueUrl);
    const response = await read;
    expect(response.ok(), await response.text()).toBe(true);
    const data = await response.json();
    expect(data.total).toBe(1);
    expect(data.items[0]).toMatchObject({ id, revision: 1, state });
    await expect(
      queue
        .locator(isMobile ? ".sb-phone-list" : ".sb-desktop-grid")
        .getByText(state, { exact: true })
        .first(),
    ).toBeVisible();
  }
  async function openSnapshot() {
    const read = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/v1/sales/handovers/receiving/" + id &&
        response.request().method() === "GET",
    );
    const row = isMobile
      ? queue
          .locator(".sb-phone-row")
          .filter({ hasText: opportunity.title })
          .getByRole("button")
      : queue.getByRole("button", { name: opportunity.title, exact: true });
    await row.click();
    const response = await read;
    expect(response.ok(), await response.text()).toBe(true);
    const snapshot = page.getByRole("dialog", {
      name: "Submitted Sales brief snapshot",
    });
    await expect(snapshot.getByText(content.problem)).toBeVisible();
    await expect(
      snapshot.getByRole("link", { name: "Open opportunity", exact: true }),
    ).toHaveAttribute("href", "/sales/opportunities/" + opportunity.id);
    await expect(
      snapshot.getByRole("link", { name: "Open brief", exact: true }),
    ).toHaveAttribute(
      "href",
      "/sales/handoffs/estimating/" + id + "?revision=1",
    );
    return snapshot;
  }
  await readQueue("Submitted");
  const initial = await openSnapshot();
  await initial.getByRole("button", { name: "Close brief snapshot" }).click();
  await page.goto("about:blank");
  await call(path, {
    ...crmBase(),
    action: "Return",
    expected_version: 3,
    note: "SYN review a corrected successor",
  });
  await call(path, {
    ...crmBase(),
    action: "Successor",
    expected_version: 4,
    note: "SYN successor preparation",
  });
  await call(path, {
    ...crmBase(),
    action: "Save",
    expected_version: 5,
    content: { ...content, problem: "SYN unsubmitted successor only" },
    receiving_owner_id: null,
    note: "SYN draft remains separate",
  });
  await readQueue("Returned");
  const retained = await openSnapshot();
  await expect(retained).not.toContainText("SYN unsubmitted successor only");
  const recordRead = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/" + path &&
      response.request().method() === "GET",
  );
  await retained.getByRole("link", { name: "Open brief", exact: true }).click();
  expect((await recordRead).ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Submitted Sales brief · revision 1" }),
  ).toBeVisible();
  await expect(page.getByText(content.problem, { exact: true })).toBeVisible();
  await expect(
    page.getByText("SYN unsubmitted successor only", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Accept exact revision" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Review the current brief separately" }),
  ).toHaveAttribute("href", "/sales/handoffs/estimating/" + id);
});
