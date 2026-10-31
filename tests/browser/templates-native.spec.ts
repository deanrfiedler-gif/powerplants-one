import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import { setupDraft, grantDraft, id } from "../helpers/template-drafts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
test.setTimeout(180000);
test.use({
  viewport: { width: 1440, height: 900 },
  isMobile: false,
  hasTouch: false,
});
test.beforeAll(async () => {
  await reset();
  const { reviewer } = await setupDraft();
  await grantDraft(reviewer, [
    "template.publish",
    "pack.check",
    "template.assign",
  ]);
});
test.afterAll(closeDatabase);
async function session(page: Page, profile: string) {
  const response = await page.request.post("/api/v1/local-session", {
    headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
    data: { profile },
  });
  expect(response.status()).toBe(200);
}
async function submit(page: Page, label: string, path: string) {
  const response = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      new URL(r.url()).pathname === `/api/v1/${path}`,
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: label, exact: true })
    .click();
  const saved = await response;
  expect(saved.status(), await saved.text()).toBe(201);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return saved.request().postDataJSON();
}
test("DK06 native browser creates, independently reviews, publishes and assigns one exact definition", async ({
  page,
}) => {
  await page.route(/^https:\/\/[^/]+\.fontawesome\.com\//, (r) => r.abort());
  await session(page, "coordinator");
  await page.goto("/documents/templates?view=proposals&family=OUT-09");
  await page.getByRole("button", { name: "New proposal", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Company", { exact: true }).selectOption(id("20"));
  await dialog.getByLabel("Site", { exact: true }).selectOption(id("70"));
  await dialog
    .getByLabel("Base template", { exact: true })
    .selectOption(id("c1", 2));
  const title = "SYN Browser job pack " + randomUUID().slice(0, 8);
  await dialog.getByLabel("Title", { exact: true }).fill(title);
  await dialog.getByLabel("Field 1 key", { exact: true }).fill("site");
  await dialog.getByLabel("Field 1 label", { exact: true }).fill("Site");
  await dialog
    .getByLabel("Field 1 source", { exact: true })
    .selectOption("site.name");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Native browser proposal");
  const created = await submit(
    page,
    "Create proposal",
    "document-template-drafts",
  );
  const path = `/documents/templates/proposals/${created.id}`;
  await expect(page).toHaveURL(new RegExp(created.id + "$"));
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review", exact: true }),
  ).toHaveCount(0);
  await session(page, "cs-reviewer");
  await page.reload();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Outcome", { exact: true }).selectOption("Reviewed");
  for (const label of ["Schema", "Source bindings", "Audience"]) {
    await dialog.getByLabel(label, { exact: true }).selectOption("Pass");
    await dialog
      .getByLabel(label + " observation", { exact: true })
      .fill("SYN Exact independent review");
  }
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Independent review accepted");
  const review = await submit(
    page,
    "Record review",
    `document-template-drafts/${created.id}/reviews`,
  );
  expect(review.revision_id).toBe(created.revision_id);
  await page.getByRole("tab", { name: "Publication", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish version 3", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Service approval note", { exact: true })
    .fill("SYN Exact supported layout approved");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Separate publication");
  const publication = await submit(
    page,
    "Publish version 3",
    `document-template-drafts/${created.id}/publication`,
  );
  expect(publication.revision_id).toBe(created.revision_id);
  expect(publication.review_id).toBe(review.review_id);
  await page.getByRole("link", { name: "Open site use", exact: true }).click();
  await expect(
    page.getByText("Workspace default · not adopted", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Assign use", exact: true })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Publication at this site", { exact: true })
    .selectOption(publication.id);
  await dialog
    .getByLabel("Service approval note", { exact: true })
    .fill("SYN Site use independently recorded");
  await dialog
    .getByLabel("Reason", { exact: true })
    .fill("SYN Exact site interval");
  const assignment = await submit(
    page,
    "Assign use",
    "document-template-use-assignments",
  );
  expect(assignment.publication_id).toBe(publication.id);
  expect(assignment.predecessor_id).toBeNull();
  await expect(
    page.getByRole("link", { name: "Job pack · version 3", exact: true }),
  ).toBeVisible();
  const read = await page.request.get(
    `/api/v1/document-template-use-assignments/${assignment.id}`,
  );
  expect(read.status()).toBe(200);
  expect((await read.json()).assignment.template_id).toBe(
    publication.template_id,
  );
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/testing/evidence/template-management/workspace/native-published-proposal-320.png",
  });
});
