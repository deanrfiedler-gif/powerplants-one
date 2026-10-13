import { test, expect } from "@playwright/test";
import { projectInput, taskInput } from "../helpers/projects";
import { calendarInput, actualInput } from "../helpers/project-programme";
test("saved Project calendar drives native warnings and baseline copy", async ({
  page,
  baseURL,
}, info) => {
  const call = async (path: string, data: unknown) => {
    const response = await page.request.post(`/api/v1/${path}`, {
      headers: { Origin: baseURL! },
      data,
    });
    expect(response.ok(), await response.text()).toBe(true);
  };
  await call("local-session", { profile: "coordinator" });
  const project = projectInput(),
    task = {
      ...taskInput(),
      start_date: "2026-09-15",
      finish_date: "2026-09-16",
    };
  await call("projects", project);
  await call(`projects/${project.id}/tasks`, task);
  await call(`projects/${project.id}/calendar`, calendarInput());
  await call(`projects/${project.id}/tasks/${task.id}/actuals`, actualInput());
  await page.goto(`/projects/${project.id}`);
  await page.getByRole("button", { name: task.title, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Edit task", exact: true }).click();
  await expect(
    dialog.getByText(
      "A date falls on a nonworking day in the saved Project calendar.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(dialog.getByLabel("Start date", { exact: true })).toHaveValue(
    "2026-09-15",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page
    .getByRole("button", { name: "Baselines and forecast", exact: true })
    .click();
  await expect(
    dialog.getByText("Current calendar: SYN reviewed site calendar.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("saved-calendar.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Close baselines" }).click();
  await page
    .getByRole("button", { name: "Change history", exact: true })
    .click();
  await expect(
    dialog.getByText("Working calendar recorded", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Actual dates recorded", { exact: false }),
  ).toBeVisible();
});
