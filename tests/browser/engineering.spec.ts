import { test, expect, type Page } from "@playwright/test";
import { projectInput } from "../helpers/projects";
import { engineeringInput, engineeringUpdate } from "../helpers/engineering";
import { CRM } from "../helpers/crm";
test.describe.configure({ timeout: 120000 });
async function call(page: Page, path: string, body?: unknown) {
  const response = await page.request.fetch(`/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { Origin: "http://127.0.0.1:3000" },
    data: body,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}
test("accepted container creates a real request; an uncertain note retries once and survives reload", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const project = {
    ...projectInput(),
    title: `SYN Engineering source ${info.project.name} ${Date.now()}`,
  };
  await call(page, "projects", project);
  await page.goto("/engineering");
  await page.getByRole("button", { name: "＋ Request", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const title = `SYN Engineering ${info.project.name} ${Date.now()}`;
  await dialog.getByLabel("Work package title", { exact: true }).fill(title);
  await dialog
    .getByRole("combobox", { name: "Project", exact: true })
    .fill(project.title);
  await dialog.locator(`[data-record-id="${project.id}"]`).click();
  await dialog
    .getByLabel("Design brief", { exact: true })
    .fill("SYN Confirm pump access and pipework arrangement.");
  await dialog
    .getByRole("combobox", { name: "Assigned engineer", exact: true })
    .fill("SYN");
  await dialog.locator(`[data-record-id="${CRM.owner}"]`).click();
  await dialog
    .getByLabel("Package required by", { exact: true })
    .fill("2028-03-31");
  await dialog
    .getByLabel("Next action due", { exact: true })
    .fill("2028-03-20");
  await dialog
    .getByRole("button", { name: "Create request", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const list = await call(page, `engineering?q=${encodeURIComponent(title)}`);
  expect(list.items).toHaveLength(1);
  const id = list.items[0].id;
  await dialog
    .getByRole("tab", { name: "Review & history", exact: true })
    .click();
  const note = "SYN Retain a service clearance check for the design review.";
  await dialog.getByLabel("Add a review note", { exact: true }).fill(note);
  await dialog.getByRole("tab", { name: "Deliverables", exact: true }).click();
  await dialog
    .getByRole("tab", { name: "Review & history", exact: true })
    .click();
  await expect(
    dialog.getByLabel("Add a review note", { exact: true }),
  ).toHaveValue(note);
  let operation = "";
  await page.route(
    `**/api/v1/engineering/${id}/notes`,
    async (route) => {
      operation = route.request().postDataJSON().operation_id;
      expect((await route.fetch()).ok()).toBe(true);
      await route.abort("failed");
    },
    { times: 1 },
  );
  await dialog.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Retry original note" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Close package" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Retry original note" }).click();
  await expect(dialog.getByText("Note saved.", { exact: true })).toBeVisible();
  await page.goto(`/engineering/${id}`);
  await expect(
    dialog.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const saved = await call(page, `engineering/${id}`);
  expect(saved.package.version).toBe(2);
  expect(saved.events).toHaveLength(2);
  expect(saved.events[0].note).toBe(note);
  const receipt = await call(page, `operations/${operation}`);
  expect(receipt.record_id).toBe(id);
  expect(receipt.record_version).toBe(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("stale coordination cannot overwrite a newer update and cross-company records remain unavailable", async ({
  page,
}) => {
  await call(page, "local-session", { profile: "coordinator" });
  const project = projectInput();
  await call(page, "projects", project);
  const request = engineeringInput(project.id);
  await call(page, "engineering", request);
  await page.goto(`/engineering/${request.id}`);
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Update coordination", exact: true })
    .click();
  await dialog
    .getByLabel("Next action", { exact: true })
    .fill("SYN An unsaved local action");
  await dialog
    .getByLabel("Reason for update", { exact: true })
    .fill("SYN Coordinate the site visit");
  await call(
    page,
    `engineering/${request.id}/coordination`,
    engineeringUpdate(),
  );
  await dialog
    .getByRole("button", { name: "Save coordination", exact: true })
    .click();
  await expect(
    dialog.getByText(/The package changed. Cancel this update/),
  ).toBeVisible();
  await expect(dialog.getByLabel("Next action", { exact: true })).toHaveValue(
    "SYN An unsaved local action",
  );
  page.once("dialog", (prompt) => prompt.dismiss());
  await dialog
    .getByRole("button", { name: "Cancel update", exact: true })
    .click();
  await expect(dialog.getByLabel("Next action", { exact: true })).toHaveValue(
    "SYN An unsaved local action",
  );
  page.once("dialog", (prompt) => prompt.accept());
  await dialog
    .getByRole("button", { name: "Cancel update", exact: true })
    .click();
  await expect(
    dialog.getByText("Confirm equipment envelope", { exact: true }),
  ).toBeVisible();
  expect((await call(page, `engineering/${request.id}`)).package.version).toBe(
    2,
  );
  const rejectedOrigin = await page.request.post(
    `/api/v1/engineering/${request.id}/coordination`,
    {
      headers: { Origin: "https://example.invalid" },
      data: engineeringUpdate(2),
    },
  );
  expect(rejectedOrigin.status()).toBe(403);
  await call(page, "local-session", { profile: "second-company" });
  expect(
    (await page.request.get(`/api/v1/engineering/${request.id}`)).status(),
  ).toBe(404);
  expect((await call(page, `engineering?q=${request.id}`)).items).toHaveLength(
    0,
  );
});
