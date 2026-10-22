import { test, expect, type Page } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";
import { assistantEnabled } from "../../src/assistant/config";

// Explicit enabled local-synthetic proof. Compiled/ordinary off-state suites do not pretend to execute Carl.
test.skip(
  ({ browserName: _browserName }, info) => Boolean(info.config.metadata.conversationsAgentOff) || !assistantEnabled(),
  "Requires the enabled non-production local-synthetic harness; the production guard remains intact.",
);
const worker = () =>
  promisify(execFile)(
    process.execPath,
    ["--env-file=.env.local", "--import", "tsx", "scripts/document-worker.ts"],
    { cwd: process.cwd(), timeout: 60000 },
  );
async function api(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`/api/v1/${path}`, {
    method: body ? "POST" : "GET",
    data: body,
    headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
  });
  expect(r.ok()).toBe(true);
  return r.json();
}
test("T2c persisted UI post, original-operation recovery, existing worker, answer and human ask", async ({
  page,
}, info) => {
  const reader = await api(page, "local-session", { profile: "crm-receiver" });
  await api(page, "local-session", { profile: "coordinator" });
  const deal = crmCreate();
  await api(page, "crm/opportunities", deal);
  const started = await api(page, "conversations", {
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN T2c worker proof",
    anchor_type: "Opportunity",
    anchor_id: deal.id,
    title: "SYN persisted Carl proof",
    body: "SYN question",
    mentions: [],
    asks: [],
  });
  const thread = started.record_id as string;
  await page.goto(`/conversations/${thread}`);
  await page.getByRole("button", { name: "Tag a person", exact: true }).click();
  await page.getByRole("option", { name: /Carl · AI assistant/ }).click();
  const people = await api(
    page,
    `conversations/people?anchor_type=Opportunity&anchor_id=${deal.id}`,
  );
  const name = people.items.find(
    (p: { id: string }) => p.id === reader.actor_id,
  ).display_name as string;
  await page.getByRole("button", { name: "Tag a person", exact: true }).click();
  await page.getByRole("option", { name: new RegExp(name) }).click();
  await page.getByRole("switch", { name: `Ask ${name}` }).click();
  await page
    .getByRole("textbox", { name: `Question for ${name}`, exact: true })
    .fill("SYN delivery date?");
  let original: Record<string, unknown> | undefined;
  await page.route(
    `**/api/v1/conversations/${thread}/messages`,
    async (route) => {
      original = route.request().postDataJSON();
      await route.fetch(); // Server accepts; the response is lost, not the operation.
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText(/The original message is retained/),
  ).toBeVisible();
  expect(original?.mentions).toEqual([
    { ordinal: 1, kind: "Agent" },
    { ordinal: 2, kind: "Person", person_id: reader.actor_id },
  ]);
  await page.reload(); // Recovery reads the original receipt. It does not issue a second post.
  await expect(page.locator('.cv-turn[data-state="Queued"]')).toBeVisible();
  const queued = await api(page, `conversations/${thread}`);
  expect(queued.turns).toHaveLength(1);
  expect(queued.asks[0].state).toBe("Open");
  await worker();
  await expect(page.locator(".cv-agent-message")).toContainText("Simulated");
  await expect(page.locator(".cv-agent-message")).toContainText("Acting for");
  await expect(
    page.locator(".cv-agent-message").getByRole("link").first(),
  ).toBeVisible();
  await worker();
  await page.reload();
  await expect(page.locator(".cv-agent-message")).toHaveCount(1);
  const answered = await api(page, `conversations/${thread}`);
  expect(answered.turns).toHaveLength(1);
  expect(answered.turns[0].state).toBe("Answered");
  expect(answered.asks[0].state).toBe("Open");
  await page.screenshot({
    path: info.outputPath("persisted-worker-answer.png"),
    fullPage: true,
  });
});
