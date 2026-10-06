import { test, expect } from "@playwright/test";
import { closeDatabase } from "../../src/platform/database";
import { publishSchedulingPolicy } from "../../src/scheduling/policy-commands";
import { setupPolicy, reviewed } from "../helpers/policy-commands";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
test.beforeEach(setupPolicy);
test.afterAll(closeDatabase);

test("saved record selection retains explicit disclosure intent before the queued native toggle", async ({
  page,
}, info) => {
  const f = await reviewed();
  const publication = await publishSchedulingPolicy(f.publisher, f.publish);
  const login = await page.request.post("/api/v1/local-session", {
    headers: { Origin: origin },
    data: { profile: "scheduling-policy-publisher" },
  });
  expect(login.ok()).toBeTruthy();
  await page.goto("/schedule/policy-impact");
  const summary = page.getByText("Reopen saved records", { exact: true });
  await expect(summary).toBeVisible();
  // Native details toggle notification is queued. Make both user interactions
  // in one browser turn so the record-type read unmounts the old disclosure
  // before that notification can carry its open state back into React.
  await summary.evaluate((node) => {
    (node as HTMLElement).click();
    const select = node.parentElement!.querySelector("select")!;
    select.value = "publication";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const selector = page.getByLabel("Saved record type", { exact: true });
  await expect(selector).toBeVisible();
  await expect(selector).toHaveValue("publication");
  const link = page.getByRole("link", {
    name: `Open publication ${publication.receipt.record_id}`,
    exact: true,
  });
  await expect(link).toBeVisible();
  await page
    .getByRole("button", { name: "Refresh saved records", exact: true })
    .click();
  await expect(link).toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(selector).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(link).toBeVisible();
  await page.screenshot({
    path: info.outputPath("saved-publication-list.png"),
  });
  await link.click();
  await expect(
    page.getByRole("heading", { name: "Saved publication", exact: true }),
  ).toBeVisible();
});
