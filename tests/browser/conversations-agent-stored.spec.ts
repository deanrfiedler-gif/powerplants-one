import { test, expect, type Page } from "@playwright/test";
import { closeDatabase } from "../../src/platform/database";
import { storedAgentThread } from "../helpers/conversations-agent";

test.afterAll(closeDatabase);
async function signIn(page: Page, profile: string) {
  const r = await page.request.post("/api/v1/local-session", {
    data: { profile },
    headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
  });
  expect(r.ok()).toBe(true);
}

test("T2c persisted answers render with the application off; terminal reasons remain private", async ({
  page,
}, info) => {
  const stored = await storedAgentThread();
  await signIn(page, "coordinator");
  const people = await page.request.get(
    `/api/v1/conversations/people?anchor_type=Opportunity&anchor_id=${stored.deal}`,
  );
  const availability = await people.json();
  if (info.config.metadata.conversationsAgentOff) expect(availability.agent).toBeNull();
  await page.goto(`/conversations/${stored.thread}`);
  await expect(page.locator(".cv-agent-message")).toContainText("Simulated");
  await expect(
    page.locator(".cv-agent-message").getByRole("link").first(),
  ).toBeVisible();
  await page.locator(".cv-agent-message").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("persisted-stored-answer.png"), fullPage: true });
  await page.getByRole("button", { name: "Tag a person", exact: true }).click();
  await expect(
    page.locator('[role="option"][data-mention-kind="Agent"]'),
  ).toHaveCount(availability.agent ? 1 : 0);
  await expect(
    page.locator('[role="option"][data-mention-kind="Person"]').first(),
  ).toBeVisible();
  const unavailable = await storedAgentThread(false);
  await page.goto(`/conversations/${unavailable.thread}`);
  await expect(page.locator(".cv-turn")).toContainText("Carl is switched off.");
  await expect(page.locator(".cv-agent-message")).toHaveCount(0);
  await signIn(page, "crm-receiver");
  await page.goto(`/conversations/${unavailable.thread}`);
  await expect(page.locator(".cv-turn")).toContainText("Carl is unavailable");
  expect(await page.locator(".cv-turn").innerHTML()).not.toMatch(
    /switched off|FeatureOff|budget|credit/,
  );
});
