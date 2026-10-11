import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { projectInput, taskInput } from "../helpers/projects";
test.describe.configure({ timeout: 120000 });
async function call(page: Page, origin: string, path: string, data?: unknown) {
  const response = await page.request.fetch(`/api/v1/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: { Origin: origin },
    data,
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}
async function setup(page: Page, origin: string) {
  await call(page, origin, "local-session", { profile: "coordinator" });
  const project = projectInput(),
    first = {
      ...taskInput(),
      title: "SYN Long-lead procurement",
      start_date: "2028-02-28",
      finish_date: "2028-02-29",
    };
  await call(page, origin, "projects", project);
  await call(page, origin, `projects/${project.id}/tasks`, first);
  const milestone = {
    ...taskInput(2),
    title: "SYN Site ready",
    milestone: true,
    status: "Planned",
    progress: 0,
    start_date: "2028-03-01",
    finish_date: "2028-03-01",
    dependencies: [{ task_id: first.id, kind: "FS" }],
  };
  await call(page, origin, `projects/${project.id}/tasks`, milestone);
  await page.goto(`/projects/${project.id}`);
  await page
    .getByRole("button", { name: "Baselines and forecast", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("No baseline recorded.", { exact: false }),
  ).toBeVisible();
  return { project, first, milestone };
}
test("baseline retry retains one original; forecast edits expose successors and milestone slippage on reload", async ({
  page,
  baseURL,
}, info) => {
  const origin = baseURL!,
    { project, first, milestone } = await setup(page, origin),
    dialog = page.getByRole("dialog");
  let operation = "";
  await page.route(
    `**/api/v1/projects/${project.id}/baselines`,
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      operation = route.request().postDataJSON().operation_id;
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    },
    { times: 1 },
  );
  await dialog
    .getByLabel("Baseline label", { exact: true })
    .fill("SYN Delivery agreement");
  await dialog
    .getByLabel("Baseline reason", { exact: true })
    .fill("SYN Coordinator reviewed procurement and site readiness");
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Record baseline", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Retry unchanged baseline" }),
  ).toBeVisible();
  await expect(
    dialog.getByLabel("Baseline label", { exact: true }),
  ).toBeDisabled();
  await dialog
    .getByRole("button", { name: "Retry unchanged baseline" })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Baseline 1: SYN Delivery agreement" }),
  ).toBeVisible();
  const receipt = await call(page, origin, `operations/${operation}`);
  expect(receipt.state).toBe("BaselineRecorded");
  expect(receipt.record_version).toBe(3);
  await dialog.getByRole("button", { name: "Close baselines" }).click();
  await page.getByRole("button", { name: first.title, exact: true }).click();
  await dialog.getByRole("button", { name: "Edit task", exact: true }).click();
  await dialog.getByLabel("Finish date", { exact: true }).fill("2028-03-03");
  await expect(
    dialog.getByRole("heading", { name: "Successors to review" }),
  ).toBeVisible();
  await expect(
    dialog.getByText("SYN Site ready ·", { exact: false }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(dialog).toBeHidden();
  await call(page, origin, `projects/${project.id}/tasks`, {
    ...milestone,
    operation_id: randomUUID(),
    expected_version: 4,
    start_date: "2028-03-06",
    finish_date: "2028-03-06",
    reason: "SYN Site forecast follows supplier delay",
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Baselines and forecast", exact: true })
    .click();
  await expect(
    dialog.getByText("1 milestone(s) later than baseline", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByText(
      "Start: 5 calendar days later · Finish: 5 calendar days later",
    ),
  ).toBeVisible();
  const saved = await call(page, origin, `projects/${project.id}/baselines`);
  expect(saved.latest_revision).toBe(1);
  expect(
    saved.selected.snapshot.find((t: { id: string }) => t.id === milestone.id)
      .finish_date,
  ).toBe("2028-03-01");
  await expect(dialog).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("baseline-forecast.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Baselines and forecast", exact: true }),
  ).toBeFocused();
});
test("stale recording requires fresh review and a denied refresh clears baseline content", async ({
  page,
  baseURL,
}) => {
  const origin = baseURL!,
    { project, first } = await setup(page, origin),
    dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Baseline label", { exact: true })
    .fill("SYN Revised plan");
  await dialog
    .getByLabel("Baseline reason", { exact: true })
    .fill("SYN Review before recording");
  await dialog.getByRole("checkbox").check();
  await call(page, origin, `projects/${project.id}/tasks`, {
    ...first,
    operation_id: randomUUID(),
    expected_version: 3,
    finish_date: "2028-03-03",
  });
  await dialog
    .getByRole("button", { name: "Record baseline", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("changed");
  await dialog.getByRole("button", { name: "Refresh comparison" }).click();
  await expect(
    dialog.getByText("Forecast version 4", { exact: false }),
  ).toBeVisible();
  await expect(dialog.getByRole("checkbox")).not.toBeChecked();
  await expect(
    dialog.getByLabel("Baseline label", { exact: true }),
  ).toHaveValue("SYN Revised plan");
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "Record baseline", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Baseline 1: SYN Revised plan" }),
  ).toBeVisible();
  await page.route(`**/api/v1/projects/${project.id}/baselines*`, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        code: "Unavailable",
        message: "This project is unavailable.",
      }),
    }),
  );
  await dialog.getByRole("button", { name: "Refresh comparison" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText("SYN Revised plan", { exact: false }),
  ).toHaveCount(0);
});
