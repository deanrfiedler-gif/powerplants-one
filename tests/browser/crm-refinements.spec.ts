import {
  test,
  expect,
  type Frame,
  type Page,
  type Request,
} from "@playwright/test";
import { crmCreate } from "../helpers/crm";
import type { DirectoryView } from "../../src/crm/directory";
test.describe.configure({ timeout: 120000 });
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(r.ok(), await r.text()).toBe(true);
  return r.json();
}
test("card hit areas, snapshot, core pencil, separate scope and stage changes persist", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = crmCreate();
  input.title = `SYN CRM refinements ${info.project.name}`;
  await call(page, "crm/opportunities", input);
  await page.goto("/crm/opportunities");
  await page
    .getByLabel("Search opportunities", { exact: true })
    .fill(input.title);
  const card = page.locator(`[data-opportunity-id="${input.id}"]`);
  await expect(card).toBeVisible();
  expect(await card.locator(".crm-card-body a").count()).toBe(0);
  await expect(card.locator(".crm-card-contact")).not.toContainText(
    "SYN Coordinator",
  );
  if (!info.project.use.isMobile) {
    await expect(card).toHaveAttribute("draggable", "true");
    await card.locator(".crm-card-company").click();
    const snapshot = page.getByRole("dialog");
    await expect(snapshot).toBeVisible();
    await expect(
      snapshot.getByRole("heading", { name: "Deal summary" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/crm\/opportunities$/);
    await page.keyboard.press("Escape");
    await expect(snapshot).not.toBeVisible();
    await expect(card.locator(".crm-card-body")).toBeFocused();
    await card.locator(".crm-card-contact").click();
    await page
      .getByRole("link", { name: "Open full deal", exact: true })
      .click();
  } else {
    await expect(card).toHaveAttribute("draggable", "false");
    await card.locator(".crm-card-company").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(page).toHaveURL(new RegExp(`/crm/opportunities/${input.id}$`));
  await page
    .getByRole("button", { name: "Edit deal information", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Edit deal", exact: true });
  await expect(dialog.getByLabel("Deal title", { exact: true })).toBeVisible();
  await expect(
    dialog.getByLabel("Customer need and objective", { exact: true }),
  ).toHaveCount(0);
  await dialog
    .getByLabel("Deal title", { exact: true })
    .fill(input.title + " updated");
  await dialog
    .getByLabel("Deal value · AUD, excl. GST", { exact: true })
    .fill("12345.67");
  await dialog
    .getByLabel("Expected close date", { exact: true })
    .fill("2026-11-30");
  await dialog.getByRole("button", { name: "Save deal", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: input.title + " updated", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".crm-deal-key-facts")).toContainText("$12,345.67");
  await page.getByRole("tab", { name: "Details", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit requirements and scope", exact: true })
    .click();
  dialog = page.getByRole("dialog", {
    name: "Edit requirements and scope",
    exact: true,
  });
  await dialog
    .getByLabel("Inclusions", { exact: true })
    .fill("SYN Sensors and commissioning");
  await dialog
    .getByRole("button", { name: "Save requirements and scope", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Details", exact: true }).click();
  await expect(page.locator(".crm-scope-section")).toContainText(
    "SYN Sensors and commissioning",
  );
  if (!info.project.use.isMobile) {
    await page.goto("/crm/opportunities");
    await page
      .getByLabel("Search opportunities", { exact: true })
      .fill(input.title);
    await card.dragTo(page.locator('[data-drop-stage="Qualified"]'));
  } else {
    await page
      .locator(".crm-stage-track")
      .getByRole("button", { name: "Qualified", exact: true })
      .click();
  }
  dialog = page.getByRole("dialog", { name: "Change deal stage", exact: true });
  await expect(dialog).toBeVisible();
  await dialog
    .getByLabel("Deal stage", { exact: true })
    .selectOption("Qualified");
  await dialog
    .getByLabel("Qualification outcome", { exact: true })
    .fill("SYN Need and contact confirmed");
  const persistedRead = info.project.use.isMobile
    ? page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          response.request().method() === "GET" &&
          url.pathname === `/api/v1/crm/opportunities/${input.id}` &&
          response.status() === 200
        );
      })
    : null;
  await dialog.getByRole("button", { name: "Save stage", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  if (persistedRead) await (await persistedRead).finished();
  let record = (await call(page, `crm/opportunities/${input.id}`)).items[0];
  expect(record.stage_id).toBe("Qualified");
  expect(record.value_amount).toBe("12345.67");
  expect(record.scope_details.inclusions).toBe("SYN Sensors and commissioning");
  if (!info.project.use.isMobile) {
    await page
      .getByRole("button", { name: "Undo stage move", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Save stage", exact: true })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    record = (await call(page, `crm/opportunities/${input.id}`)).items[0];
    expect(record.stage_id).toBe("Enquiry");
  }
  await page.goto(`/crm/opportunities/${input.id}`);
  await page.getByRole("tab", { name: "Files", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Deal documents", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("crm-deal-files.png") });
  await page.goto("/crm/opportunities");
  await page
    .getByLabel("Search opportunities", { exact: true })
    .fill(input.title);
  if (info.project.use.isMobile)
    await page.getByRole("button", { name: /^Qualified \(/ }).click();
  await card.locator(".crm-card-activity").click();
  await expect(page).toHaveURL(new RegExp(`/work/${input.initial_action.id}$`));
});
test("desktop directory tables and mobile lists share saved, scoped queries", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  await page.goto("/people");
  await expect(
    page.getByRole("heading", { name: "People", exact: true }),
  ).toBeVisible();
  const savedView = page.getByLabel("Saved view", { exact: true });
  await expect(savedView).toBeVisible();
  await expect(savedView).toHaveAccessibleName("Saved view");
  await page.getByLabel("Status", { exact: true }).selectOption("Active");
  await page.getByLabel("Rows per page", { exact: true }).selectOption("50");
  if (info.project.use.isMobile) {
    await expect(page.locator(".crm-directory-mobile")).toBeVisible();
    await expect(page.locator(".crm-directory-table-scroll")).not.toBeVisible();
    await page.setViewportSize({ width: 320, height: 640 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } else {
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("button", { name: /^Name/ }).click();
    await expect(page.locator('th[aria-sort="descending"]')).toContainText(
      "Name",
    );
  }
  await page
    .getByRole("button", { name: "Columns and views", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Phone", exact: true }).uncheck();
  const viewName = `SYN Contact view ${info.project.name}`;
  await page.getByLabel("View name", { exact: true }).fill(viewName);
  await page.getByRole("button", { name: "Save view", exact: true }).click();
  await expect(
    page.getByText("View saved for your account.", { exact: true }),
  ).toBeVisible();
  await expect(savedView).toHaveValue(viewName);
  // Observe the real reload read, so a missing preset fails at its source.
  // Exclude a save-time refresh or poll belonging to the outgoing document.
  let reloadCommitted = false;
  const reloadRequests = new Set<Request>();
  const onNavigation = (frame: Frame) => {
    if (frame === page.mainFrame()) reloadCommitted = true;
  };
  const onRequest = (request: Request) => {
    if (reloadCommitted) reloadRequests.add(request);
  };
  page.on("framenavigated", onNavigation);
  page.on("request", onRequest);
  let persisted: { version: number; views: DirectoryView[] };
  try {
    const [viewsResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          reloadRequests.has(response.request()) &&
          response.request().method() === "GET" &&
          url.pathname === "/api/v1/crm/directory/views" &&
          url.searchParams.get("kind") === "people"
        );
      }),
      page.reload(),
    ]);
    expect(viewsResponse.status()).toBe(200);
    persisted = await viewsResponse.json();
  } finally {
    page.off("framenavigated", onNavigation);
    page.off("request", onRequest);
  }
  expect(persisted.version).toBeGreaterThan(0);
  expect(persisted.views.find((view) => view.name === viewName)).toEqual({
    name: viewName,
    q: "",
    status: "Active",
    mine: "false",
    sort: "name",
    direction: info.project.use.isMobile ? "asc" : "desc",
    limit: "50",
    columns: [
      "name",
      "organisations",
      "email",
      "preference",
      "status",
      "deals",
    ],
  });
  await expect(savedView).toHaveAccessibleName("Saved view");
  await expect(savedView).toHaveValue("");
  await savedView.selectOption(viewName);
  await expect(savedView).toHaveValue(viewName);
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "Active",
  );
  await expect(page.getByLabel("Rows per page", { exact: true })).toHaveValue(
    "50",
  );
  if (!info.project.use.isMobile) {
    await expect(page.locator('th[aria-sort="descending"]')).toContainText(
      "Name",
    );
    await expect(
      page.getByRole("columnheader", { name: "Phone", exact: true }),
    ).toHaveCount(0);
  }
  await page.screenshot({ path: info.outputPath("crm-people-directory.png") });
  await page.goto("/customers");
  await expect(
    page.getByRole("heading", { name: "Organisations", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(
      info.project.use.isMobile
        ? ".crm-directory-mobile"
        : ".crm-directory-table",
    ),
  ).toContainText("SYN");
  await page.screenshot({
    path: info.outputPath("crm-organisations-directory.png"),
  });
});
