import { test, expect } from "../helpers/browser-lifecycle";
import { call } from "../helpers/quality-browser";
import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
test.use({ timezoneId: "UTC" });

test("CV-05 work-order proposal keeps correctable input and recovers one original after an interrupted response and reload", async ({
  page,
}, info) => {
  await call(page, "local-session", { profile: "coordinator" });
  const wid = "a9000000-0000-4000-8000-000000000001",
    path = `service/work-orders/${wid}/visits`;
  await page.goto(`/service/work-orders/${wid}#planned-visits`);
  await page.getByText("Propose a visit", { exact: true }).click();
  const start = page.getByLabel("Proposed start (device timezone)"),
    end = page.getByLabel("Proposed finish (device timezone)");
  await start.fill("2026-12-28T00:00");
  await end.fill("2026-12-27T02:00");
  await page
    .getByRole("button", { name: "Save proposed visit", exact: true })
    .click();
  await expect(page.locator(".business-error")).toContainText(
    "Finish must follow start",
  );
  await expect(start).toHaveValue("2026-12-28T00:00");
  await end.fill("2026-12-28T02:00");
  // Another authorised session advances the real order while this form retains
  // its observed version. The refusal must retain correctable dates.
  const w = (await call(page, `service/work-orders/${wid}`)).items[0];
  const r = w.scopes.find((x: { id: string }) => x.id === w.scope_revision_id);
  await call(page, path, {
    operation_id: randomUUID(),
    schema_version: 1,
    reason: "SYN concurrent separate proposal for stale-version verification",
    id: randomUUID(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    start_at: "2026-12-29T00:00:00Z",
    end_at: "2026-12-29T02:00:00Z",
    requested_window_start: null,
    requested_window_end: null,
    customer_commitment: "Unknown",
    preparation_status: "Unknown",
  });
  await page
    .getByRole("button", { name: "Save proposed visit", exact: true })
    .click();
  await expect(page.locator(".business-error")).toContainText("changed");
  await expect(start).toHaveValue("2026-12-28T00:00");
  // Compare the actual new version without remounting or discarding input.
  // Adoption is explicit after a definite refusal, never an uncertain rebase.
  await page
    .getByRole("button", { name: "Compare saved version", exact: true })
    .click();
  await expect(start).toHaveValue("2026-12-28T00:00");
  await expect(end).toHaveValue("2026-12-28T02:00");
  const form = page
    .locator("form")
    .filter({
      has: page.getByRole("button", {
        name: "Save proposed visit",
        exact: true,
      }),
    });
  await form
    .getByRole("button", {
      name: "Use latest version with my proposal",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Preparation state", { exact: true })
    .selectOption("Preparing");
  let body: { id: string; operation_id: string } | undefined,
    receipt: Record<string, unknown> | undefined;
  await page.route(
    `**/api/v1/${path}`,
    async (route) => {
      body = route.request().postDataJSON();
      const response = await route.fetch();
      expect(response.status()).toBe(201);
      receipt = await response.json();
      await route.abort("failed");
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Save proposed visit", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Original operation recovery" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save proposed visit", exact: true }),
  ).toBeDisabled();
  await expect(start).toHaveValue("2026-12-28T00:00");
  const savedId = body!.id,
    originalId = body!.operation_id;
  await page.reload();
  await page.getByText("Propose a visit", { exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Saved booking step" }),
  ).toContainText("Proposed visit saved");
  const recovered = await call(page, `operations/${originalId}`);
  expect(recovered).toEqual(receipt);
  const saved = (await call(page, `service/work-orders/${wid}`)).items[0];
  expect(
    saved.visits.filter((x: { id: string }) => x.id === savedId),
  ).toHaveLength(1);
  expect(
    (await call(page, `appointments/${savedId}`)).items[0].preparation_status,
  ).toBe("Preparing");
  const next = page.getByRole("link", {
    name: "Continue booking / View appointment",
    exact: true,
  });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(
    new RegExp(`/service/appointments/${savedId}\\?returnTo=`),
  );
  await expect(
    page.getByRole("region", { name: "Visit entry guidance" }),
  ).toContainText("before Scheduling accepts");
  await writeFile(
    info.outputPath("closed-visit-proposal-recovery.json"),
    JSON.stringify(
      {
        appointment_id: savedId,
        operation_id: originalId,
        receipt_sha256: createHash("sha256")
          .update(JSON.stringify(recovered))
          .digest("hex"),
        state: "Proposed",
        preparation: "Preparing",
        validation_retained: true,
        stale_retained: true,
        lost_response_reload_recovered: true,
        no_duplicate: true,
      },
      null,
      2,
    ),
  );
});
