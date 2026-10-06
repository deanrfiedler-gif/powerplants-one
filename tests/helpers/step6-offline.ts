import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import type { WireOperation, Receipt } from "../../src/offline/protocol";
import { call } from "./quality-browser";

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
export async function createReadiness(page: Page) {
  const context = "70000000-0000-4000-8000-000000000001";
  const existing = await call(page, `cs/Readiness?context_id=${context}`);
  const id = existing.items[0]?.id ?? randomUUID();
  const base = () => ({
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN Step 6 owned site review instructions",
  });
  const owner_id = "30000000-0000-4000-8000-000000000001";
  const name = "SYN Step 6 site arrival and return inspection instructions";
  if (!existing.items.length)
    await call(page, "cs/Readiness", {
      ...base(),
      id,
      context_id: context,
      name,
      owner_id,
    });
  const before = await call(page, `cs/Readiness/${id}`);
  await call(page, `cs/Readiness/${id}/save`, {
    ...base(),
    expected_version: before.record.version,
    name,
    owner_id,
    content: {
      schema_version: 1,
      requirements: [
        {
          id: randomUUID(),
          revision: 1,
          title: "SYN Return arrival instructions",
          kind: "Induction",
          facility_id: null,
          activity: "*",
          source:
            "SYN Review access with the Service owner; unresolved personal induction is retained, not granted by this review.",
        },
      ],
      evidence: [],
      windows: [],
    },
  });
}
async function download(page: Page, appointment: string) {
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByLabel("Assigned job to download").selectOption(appointment);
  await page
    .getByRole("button", { name: "Download selected job", exact: true })
    .click();
  await expect(page.locator("#notice")).toContainText(
    "Job context and exact pack saved",
  );
  await page
    .getByRole("button", { name: "Open saved field job", exact: true })
    .click();
}
export async function prepareStart(page: Page, appointment: string) {
  await download(page, appointment);
  await page.context().setOffline(true);
  await page
    .getByRole("button", { name: "Save provisional start intent", exact: true })
    .click();
  await expect(page.locator("#queue .queue-row")).toHaveCount(1);
  return (await offlineRows(page))[0].original;
}
export async function prepareOriginals(page: Page, appointment: string) {
  await download(page, appointment);
  let accepted: { outcomes: { state: string; receipt: Receipt }[] } | undefined;
  await page.route("**/api/v1/sync/operations", async (route) => {
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    accepted = await response.json();
    await route.abort("failed");
  });
  for (let n = 1; n <= 3; n++) {
    await page.context().setOffline(false);
    await page
      .getByLabel("Activity to review", { exact: true })
      .fill(["Arrival", "Inspection", "Departure"][n - 1]);
    const downloaded = page.waitForResponse(
      (r) =>
        r.url().includes(`/my-jobs/${appointment}/site-readiness?`) &&
        r.request().method() === "GET",
    );
    await page
      .getByRole("button", {
        name: "Download this readiness selection",
        exact: true,
      })
      .click();
    expect((await downloaded).ok()).toBe(true);
    await expect(page.locator("#notice")).toContainText(
      "Exact readiness selection saved",
    );
    await expect(
      page.getByRole("button", {
        name: "Save readiness review locally",
        exact: true,
      }),
    ).toBeVisible();
    await page.context().setOffline(true);
    await page
      .getByLabel("My review note and conditions to escalate", { exact: true })
      .fill(
        `SYN Review ${n}: access instructions read; personal induction remains for the Service owner.`,
      );
    await page
      .getByRole("checkbox", {
        name: "I reviewed this exact cached source, visit and unresolved conditions",
        exact: true,
      })
      .check();
    await page
      .getByRole("button", {
        name: "Save readiness review locally",
        exact: true,
      })
      .click();
    await expect(page.locator("#queue .queue-row")).toHaveCount(n);
    if (n < 3) {
      await page.context().setOffline(false);
      await send(page);
      await expect
        .poll(
          async () =>
            (await offlineRows(page)).filter(
              (r) => r.status.code === "OutcomeUncertain",
            ).length,
        )
        .toBe(n);
      expect(accepted?.outcomes.map((r) => r.state)).toEqual(
        Array(n).fill("ServerSaved"),
      );
    }
  }
  await page.unroute("**/api/v1/sync/operations");
  const pending = (await offlineRows(page)).at(-1)!.original;
  const unsupported = randomUUID();
  // Only this deliberately unsupported fixture uses the owner/hash-checked
  // writer. All supported originals originate in the old application's UI.
  await page.evaluate(
    async ({ pending, id }) => {
      const path = "/offline/modules/offline/store.js",
        protocol = "/offline/modules/offline/protocol.js";
      const store = await import(path),
        hashing = await import(protocol);
      const original = {
        ...pending,
        schema_version: 2,
        operation_id: id,
        payload: { ...pending.payload, operation_id: id },
      };
      original.payload_hash = await hashing.sha256(
        hashing.canonical(hashing.original(original)),
      );
      await store.commitOperations((await store.ownership()).owner, [original]);
    },
    { pending, id: unsupported },
  );
  const originals = (await offlineRows(page)).map((r) => r.original);
  expect(originals).toHaveLength(4);
  await page.reload();
  expect((await offlineRows(page)).map((r) => r.original)).toEqual(originals);
  return {
    originals,
    receipts: accepted!.outcomes.map((r) => r.receipt),
    pending: pending.operation_id,
    unsupported,
  };
}
export type OfflineProof = Awaited<ReturnType<typeof prepareOriginals>>;
export async function send(page: Page) {
  await page
    .getByRole("button", {
      name: "Send next batch / retry originals",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Send next batch / retry originals",
      exact: true,
    }),
  ).toBeEnabled();
}
export async function verifyStart(
  page: Page,
  original: WireOperation,
  code?: string,
) {
  await page.goto("/offline/index.html");
  expect((await offlineRows(page)).map((r) => r.original)).toEqual([original]);
  await send(page);
  const row = (await offlineRows(page))[0];
  expect(row.original).toEqual(original);
  expect(["ReviewRequired", "Conflict"]).toContain(row.status.state);
  if (code) expect(row.status.code).toBe(code);
  return row;
}
export async function verifyOriginals(page: Page, proof: OfflineProof) {
  await page.goto("/offline/index.html");
  await expect(page.locator("#workspace")).toBeVisible();
  expect((await offlineRows(page)).map((r) => r.original)).toEqual(
    proof.originals,
  );
  for (let i = 0; i < 2; i++) await send(page);
  await expect
    .poll(
      async () =>
        (await offlineRows(page)).filter(
          (r) => r.status.state === "ServerSaved",
        ).length,
    )
    .toBe(3);
  const rows = await offlineRows(page);
  expect(rows.map((r) => r.original)).toEqual(proof.originals);
  for (const receipt of proof.receipts)
    expect(
      rows.find((r) => r.original.operation_id === receipt.operation_id)!.status
        .receipt,
    ).toEqual(receipt);
  expect(
    rows.find((r) => r.original.operation_id === proof.pending)!.status.receipt,
  ).toBeTruthy();
  expect(
    rows.find((r) => r.original.operation_id === proof.unsupported)!.status,
  ).toMatchObject({
    state: "ReviewRequired",
    code: "PayloadVersionUnsupported",
  });
  return rows;
}
