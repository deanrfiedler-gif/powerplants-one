import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { projectInput } from "../helpers/projects";
import { CRM } from "../helpers/crm";

// B1 (project delivery billing decision R1): the project's Field work section and the work order's
// linked project. A fresh synthetic project and work order per run keep desktop and phone independent.
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
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN B1 browser fixture",
});
async function noHorizontalScroll(page: Page) {
  expect(
    await page.evaluate(() => {
      const card = document.querySelector(".project-field-work");
      return (
        !!card &&
        card.scrollWidth <= card.clientWidth &&
        card.getBoundingClientRect().right <= window.innerWidth + 0.5
      );
    }),
  ).toBe(true);
}

test("B1 a coordinator links a work order to the project with a reason, sees it on both records, and unlinks it", async ({
  page,
  baseURL,
}, info) => {
  const origin = baseURL!;
  await call(page, origin, "local-session", { profile: "coordinator" });
  const project = projectInput();
  await call(page, origin, "projects", project);
  const order = randomUUID();
  await call(page, origin, "service/work-orders", {
    ...base(),
    id: order,
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    service_owner_id: CRM.owner,
    tickets: [
      {
        ticket_id: "40000000-0000-4000-8000-000000000020",
        issue_disposition: "SYN project field work browser request",
      },
    ],
  });
  const reference = (await call(page, origin, `service/work-orders/${order}`))
    .items[0].display_number as string;

  await page.goto(`/projects/${project.id}`);
  const section = page.getByRole("region", { name: "Field work", exact: true });
  await expect(section).toBeVisible();
  await expect(
    section.getByText("No field work you can see is linked to this project.", {
      exact: true,
    }),
  ).toBeVisible();
  await section
    .getByRole("button", { name: "Link a work order", exact: true })
    .click();
  const form = section.getByRole("form", { name: "Link a work order" });
  await form.getByLabel("Find a work order", { exact: true }).fill(reference);
  const select = form.getByLabel("Work order", { exact: true });
  await expect(select.locator("option", { hasText: reference })).toHaveCount(1);
  await select.selectOption(order);
  await form
    .getByLabel("Reason for linking", { exact: true })
    .fill("SYN field work belongs to this project");
  const link = form.getByRole("button", {
    name: "Link work order",
    exact: true,
  });
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await noHorizontalScroll(page);
  await form.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("field-work-link-form.png") });
  await link.click();
  await expect(
    section.getByText(`${reference} linked to this project`, { exact: true }),
  ).toBeVisible({ timeout: 30000 }); // First use compiles the command route.
  const row = section.getByRole("link", { name: reference, exact: true });
  await expect(row).toBeVisible();
  await noHorizontalScroll(page);
  await section.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("field-work-linked.png"),
    fullPage: true,
  });

  await row.click();
  await expect(page).toHaveURL(new RegExp(`/service/work-orders/${order}$`));
  const projectLink = page.locator(`a[href="/projects/${project.id}"]`);
  await expect(projectLink).toContainText(project.title);
  await projectLink.click();
  await expect(page).toHaveURL(new RegExp(`/projects/${project.id}$`));

  const unlinkSection = page.getByRole("region", {
    name: "Field work",
    exact: true,
  });
  const unlink = unlinkSection.getByRole("button", {
    name: `Unlink ${reference}`,
    exact: true,
  });
  expect((await unlink.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await unlink.click();
  const unlinkForm = unlinkSection.getByRole("form", {
    name: `Unlink ${reference}`,
  });
  await unlinkForm
    .getByLabel("Reason for unlinking", { exact: true })
    .fill("SYN raised against the wrong project");
  await unlinkForm
    .getByRole("button", { name: "Unlink work order", exact: true })
    .click();
  await expect(
    unlinkSection.getByText(`${reference} unlinked from this project`, {
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    unlinkSection.getByText(
      "No field work you can see is linked to this project.",
      { exact: true },
    ),
  ).toBeVisible();
  await noHorizontalScroll(page);
});
