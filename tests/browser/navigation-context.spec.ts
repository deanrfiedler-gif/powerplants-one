import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { browserFixtureCall } from "../helpers/browser-fixture-call";

const site = "70000000-0000-4000-8000-000000000001";
const company = "20000000-0000-4000-8000-000000000001";
const owner = "30000000-0000-4000-8000-000000000001";
const command = () => ({ schema_version: 1, operation_id: randomUUID(), reason: "SYN NAV contextual link fixture" });
const call = (page: Pick<Page, "request">, path: string, body: unknown) =>
  browserFixtureCall(page, path, body, new URL(test.info().project.use.baseURL!).origin);
test.beforeEach(async ({ page }) => {
  await call(page, "local-session", { profile: "coordinator" });
});

test("N01 saved survey opens each exact Equipment record and returns to its source", async ({ page }) => {
  const assets = [randomUUID(), randomUUID()], survey = randomUUID();
  for (const [index, id] of assets.entries()) {
    await call(page, "assets", {
      ...command(), id, company_id: company, site_id: site, description: `SYN NAV Equipment ${index + 1}`,
      identity_status: "Unresolved", manufacturer: "SYN NAV", model: "P45", serial: `SYN-${id}`,
      effective_at: "2026-09-01T00:00:00.000Z", configuration: "SYN NAV equipment basis",
    });
  }
  await call(page, "cs/Survey", {
    ...command(), id: survey, context_id: site, name: "SYN NAV two equipment survey", owner_id: owner,
  });
  await call(page, `cs/Survey/${survey}/save`, {
    ...command(), expected_version: 1, name: "SYN NAV two equipment survey", owner_id: owner, content: { schema_version: 1, purpose: "SYN NAV exact equipment", facility_ids: [], asset_ids: assets, observations: [] },
  });
  for (const [index, id] of assets.entries()) {
    const ready = page.waitForResponse(response => response.url().includes("/cs/Survey/options?context_id=") && response.ok());
    await page.goto(`/surveys/${survey}`);
    await ready;
    await expect(page.getByRole("heading", { name: "Exact survey scope" })).toBeVisible();
    const link = page.locator(".detail-section").getByRole("link").filter({ hasText: `SYN NAV Equipment ${index + 1}` });
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/equipment/${id}(?:\\?|$)`));
    await expect(page.getByRole("heading", { name: `SYN NAV Equipment ${index + 1}`, exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Return to source survey", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/surveys/${survey}(?:\\?|$)`));
  }
  await call(page, "local-session", { profile: "technician" });
  const denied=page.waitForResponse(r=>r.url().includes(`/api/v1/equipment/${assets[0]}`)&&[403,404].includes(r.status()));
  await page.goto(`/equipment/${assets[0]}?returnTo=${encodeURIComponent(`/surveys/${survey}`)}`);await denied;
  await expect(page.getByRole("heading",{name:"SYN NAV Equipment 1",exact:true})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Return to source survey",exact:true})).toHaveCount(0);
});

test("N02 continuing obligation opens exact owned Activity and returns to its obligation", async ({ page }) => {
  let fixture: { stage: string; obligation: string; activity: string; summary: string };
  try { fixture = JSON.parse(await readFile("verification-evidence/navigation/acceptance-fixture.json", "utf8")); }
  catch { test.skip(true, "Run the bounded synthetic acceptance fixture helper against the task-owned database."); return; }
  await page.goto(`/projects/acceptance/stages/${fixture.stage}`);
  await page.getByRole("link", { name: "Open owned Activity →", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/work/${fixture.activity}(?:\\?|$)`));
  await expect(page.getByRole("heading", { name: fixture.summary, exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Return to acceptance obligation", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/acceptance/stages/${fixture.stage}.*#obligation-${fixture.obligation}$`));
  await expect(page.locator(`#obligation-${fixture.obligation}`)).toBeVisible();
  await call(page, "local-session", { profile: "technician" });
  const denied=page.waitForResponse(r=>r.url().includes(`/api/v1/activities/${fixture.activity}`)&&[403,404].includes(r.status()));
  await page.goto(`/work/${fixture.activity}?returnTo=${encodeURIComponent(`/projects/acceptance/stages/${fixture.stage}#obligation-${fixture.obligation}`)}`);await denied;
  await expect(page.getByRole("heading",{name:fixture.summary,exact:true})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Return to acceptance obligation",exact:true})).toHaveCount(0);
});
