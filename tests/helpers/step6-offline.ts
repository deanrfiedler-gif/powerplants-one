import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { WireOperation, Receipt } from "../../src/offline/protocol";

export type OfflineRow = {
  original: WireOperation;
  status: { state: string; code?: string; receipt?: Receipt };
};
export async function offlineRows(page: Page): Promise<OfflineRow[]> {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js";
    const store = await import(path);
    return store.queue((await store.ownership()).owner);
  });
}
export async function prepareOriginals(page: Page, appointment: string) {
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByLabel("Assigned job to download").selectOption(appointment);
  await page.getByRole("button", { name: "Download selected job", exact: true }).click();
  await expect(page.locator("#notice")).toContainText("Job context and exact pack saved");
  await page.context().setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Open saved field job", exact: true }).click();
  for (let n = 1; n <= 2; n++) {
    await page.getByRole("button", { name: "Save my pack acknowledgement intent", exact: true }).click();
    await expect(page.locator("#queue .queue-row")).toHaveCount(n);
  }
  let accepted: { outcomes: { state: string; receipt: Receipt }[] } | undefined;
  await page.route("**/api/v1/sync/operations", async route => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    accepted = await response.json();
    await route.abort("failed");
  });
  await page.context().setOffline(false);
  await send(page);
  await expect.poll(async () => (await offlineRows(page)).filter(r => r.status.code === "OutcomeUncertain").length).toBe(2);
  expect(accepted?.outcomes.map(r => r.state)).toEqual(["ServerSaved", "ServerSaved"]);
  await page.unroute("**/api/v1/sync/operations");
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Save my pack acknowledgement intent", exact: true }).click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(3);
  const pending = (await offlineRows(page)).at(-1)!.original;
  const unsupported = randomUUID();
  // Only the unsupported fixture uses the existing owner/hash-checked writer.
  // Supported originals and delayed Start come from the old application's UI.
  await page.evaluate(async ({ pending, id }) => {
    const path = "/offline/modules/offline/store.js", protocol = "/offline/modules/offline/protocol.js";
    const store = await import(path), hashing = await import(protocol);
    const original = { ...pending, schema_version: 2, operation_id: id,
      payload: { ...pending.payload, operation_id: id } };
    original.payload_hash = await hashing.sha256(hashing.canonical(hashing.original(original)));
    await store.commitOperations((await store.ownership()).owner, [original]);
  }, { pending, id: unsupported });
  await page.getByRole("button", { name: "Save provisional start intent", exact: true }).click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(5);
  const originals = (await offlineRows(page)).map(r => r.original);
  await page.reload();
  expect((await offlineRows(page)).map(r => r.original)).toEqual(originals);
  return { originals, receipts: accepted!.outcomes.map(r => r.receipt), pending: pending.operation_id,
    unsupported, start: originals.find(r => r.command === "Start")!.operation_id };
}
export type OfflineProof = Awaited<ReturnType<typeof prepareOriginals>>;
export async function send(page: Page) {
  await page.getByRole("button", { name: "Send next batch / retry originals", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send next batch / retry originals", exact: true })).toBeEnabled();
}
export async function verifyOriginals(page: Page, proof: OfflineProof, startCode?: string) {
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  expect((await offlineRows(page)).map(r => r.original)).toEqual(proof.originals);
  for (let i = 0; i < 2; i++) await send(page);
  await expect.poll(async () => (await offlineRows(page)).filter(r => r.status.state === "ServerSaved").length).toBe(3);
  const rows = await offlineRows(page);
  expect(rows.map(r => r.original)).toEqual(proof.originals);
  for (const receipt of proof.receipts)
    expect(rows.find(r => r.original.operation_id === receipt.operation_id)!.status.receipt).toEqual(receipt);
  expect(rows.find(r => r.original.operation_id === proof.pending)!.status.receipt).toBeTruthy();
  expect(rows.find(r => r.original.operation_id === proof.unsupported)!.status).toMatchObject({ state: "ReviewRequired", code: "PayloadVersionUnsupported" });
  const start = rows.find(r => r.original.operation_id === proof.start)!.status;
  expect(["ReviewRequired", "Conflict"]).toContain(start.state);
  if (startCode) expect(start.code).toBe(startCode);
  return rows;
}
