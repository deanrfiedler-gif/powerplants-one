import { test, expect, type Page } from "@playwright/test";
import { projectInput, taskInput } from "../helpers/projects";
import { CRM } from "../helpers/crm";
import type { Schedule } from "../../src/projects/model";
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
test("Projects navigation, existing-context creation and an uncertain task save survive reload", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  await page.goto("/projects/new");
  const name = `SYN Gantt integration ${info.project.name} ${Date.now()}`;
  await page.getByLabel("Project name", { exact: true }).fill(name);
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .fill("SYN");
  await page.locator(`[data-record-id="${CRM.org}"]`).click();
  await page.getByRole("combobox", { name: "Site", exact: true }).fill("SYN");
  await page.locator(`[data-record-id="${CRM.site}"]`).click();
  await page
    .getByRole("combobox", { name: "Project coordinator", exact: true })
    .fill("SYN");
  await page.locator(`[data-record-id="${CRM.owner}"]`).click();
  await page.getByLabel("Target handover", { exact: true }).fill("2028-03-31");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").at(-1)!;
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const rejectedOrigin = await page.request.post(
    `/api/v1/projects/${id}/tasks`,
    { headers: { Origin: "https://example.invalid" }, data: taskInput() },
  );
  expect(rejectedOrigin.status()).toBe(403);
  let operation = "";
  await page.route(
    `**/api/v1/projects/${id}/tasks`,
    async (route) => {
      operation = route.request().postDataJSON().operation_id;
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Add task or milestone" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Task name", { exact: true })
    .fill("SYN Long-lead procurement");
  await dialog.getByLabel("Start date", { exact: true }).fill("2026-09-14");
  await dialog.getByLabel("Finish date", { exact: true }).fill("2027-12-17");
  await dialog.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Retry unchanged save" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Retry unchanged save" }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.locator(".task-row:not(.group) button.name")).toHaveText(
    "SYN Long-lead procurement",
  );
  const schedule: Schedule = await call(page, `projects/${id}`);
  expect(schedule.tasks).toHaveLength(1);
  expect(schedule.project.version).toBe(2);
  expect(schedule.tasks[0].finish_date).toBe("2027-12-17");
  const receipt = await call(page, `operations/${operation}`);
  expect(receipt.record_id).toBe(id);
  expect(receipt.record_version).toBe(2);
  await page
    .getByRole("button", { name: "Change history", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Added project schedule item",
  );
  await page.getByRole("button", { name: "Close history" }).click();
  const response = await page.request.get(`/api/v1/projects/${id}`);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await page.screenshot({ path: info.outputPath("projects-persisted.png") });
});
test("another company cannot read a schedule, task owners or history, or mutate a known task", async ({
  page,
}) => {
  await call(page, "local-session", { profile: "coordinator" });
  const input = projectInput();
  await call(page, "projects", input);
  const task = taskInput();
  await call(page, `projects/${input.id}/tasks`, task);
  await call(page, "local-session", { profile: "second-company" });
  for (const path of [
    `projects/${input.id}`,
    `projects/${input.id}/owners`,
    `projects/${input.id}/history`,
  ])
    expect((await page.request.get(`/api/v1/${path}`)).status()).toBe(404);
  expect(
    (
      await page.request.post(`/api/v1/projects/${input.id}/tasks`, {
        headers: { Origin: "http://127.0.0.1:3000" },
        data: task,
      })
    ).status(),
  ).toBe(404);
  expect((await call(page, "projects?q=" + input.id)).items).toHaveLength(0);
  expect((await call(page, "shell/search?q=" + input.id)).items).toHaveLength(
    0,
  );
  await page.goto(`/projects/${input.id}`);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("#ppo-gantt-page")).toHaveCount(0);
});
