import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Pack } from "../../src/documents/components/client/job-pack-types";
async function setup(page: Page) {
  const read = JSON.parse(
    await readFile("tests/fixtures/job-pack-read.json", "utf8"),
  ) as { items: Pack[] };
  const pack = read.items[0],
    revision = pack.revisions.find((r) => r.id === pack.current_revision_id)!;
  expect(
    (
      await page.request.post("/api/v1/local-session", {
        headers: { Origin: new URL(test.info().project.use.baseURL!).origin },
        data: { profile: "coordinator" },
      })
    ).status(),
  ).toBe(200);
  await page.route(`**/api/v1/packs/${pack.id}`, (route) =>
    route.fulfill({ json: read }),
  );
  const open = async () => {
    const ready = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/api/v1/packs/${pack.id}`) &&
        r.request().method() === "GET" &&
        r.status() === 200,
    );
    await page.goto(`/service/packs/${pack.id}`);
    await ready;
    await expect(page.locator("#jp-panel-pack .jp-paper-section")).toHaveCount(
      9,
    );
  };
  return { pack, revision, open };
}
test("SV05-I7 heading uses only the verified saved scope and retains references", async ({
  page,
}) => {
  const { pack, revision, open } = await setup(page);
  await open();
  await expect(page.locator("#jp-page-title")).toHaveText(
    pack.section_view!.scope!.summary,
  );
  await expect(page.locator(".jp-work-context")).toContainText("Inspection");
  await expect(page.locator(".jp-work-context")).toContainText(
    revision.snapshot.work.reference,
  );
  await expect(
    page
      .getByRole("navigation", { name: "Page location" })
      .getByRole("link", { name: "Service", exact: true }),
  ).toHaveAttribute("href", "/service/tickets");
  pack.section_view!.scope!.summary = "SYN newer summary";
  await open();
  await expect(page.locator("#jp-page-title")).toHaveText(
    `${revision.snapshot.work.reference} · ${revision.snapshot.appointment.reference}`,
  );
});
test("SV05-I7 action-required criteria stay visible while satisfied stage rows open by keyboard", async ({
  page,
}) => {
  const { pack, open } = await setup(page);
  await open();
  const groups = page.locator(".jp-readiness-group");
  const present = ["Authorisation", "Booking", "Dispatch", "Completion"].filter(
    (s) => pack.criteria!.some((c) => c.blocking_stage === s),
  );
  await expect(groups.locator("h3")).toHaveText(
    present.map((s) => new RegExp(`^${s} ·`)),
  );
  for (const c of pack.criteria!.filter((c) =>
    ["Unknown", "Blocked"].includes(c.outcome),
  )) {
    const row = page
      .locator(".jp-readiness-group>.jp-readiness-row")
      .filter({ hasText: c.label });
    await expect(row).toBeVisible();
  }
  const disclosures = groups.locator("details");
  for (const d of await disclosures.all())
    await expect(d).not.toHaveAttribute("open", "");
  const first = disclosures.first();
  await first.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.locator(".jp-readiness-row").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("SV05-I7 staff history and recovery show names and exact issue acknowledgements", async ({
  page,
}) => {
  const { pack, revision, open } = await setup(page);
  pack.jobs = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      revision_id: revision.id,
      state: "Failed",
      attempts: 1,
      error_code: "RenderOrStorageFailure",
      requested_at: revision.created_at,
      recovery_owner_id: "22222222-2222-4222-8222-222222222222",
      recovery_owner_name: "SYN Recovery Owner",
      issue_id: null,
      actor_name: "SYN Coordinator",
    },
  ];
  pack.acknowledgements = [
    {
      id: "33333333-3333-4333-8333-333333333333",
      issue_id: "44444444-4444-4444-8444-444444444444",
      revision: 1,
      display_name: "SYN Riley Technician",
      acknowledged_at: revision.created_at,
    },
  ];
  await open();
  await expect(page.locator(".jp-job")).toContainText("SYN Recovery Owner");
  await expect(page.locator(".jp-job")).toContainText(
    "Recover the original output.",
  );
  const visible = await page.locator("#ppo-job-pack").innerText();
  expect(visible).not.toMatch(
    /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );
  expect(visible).not.toMatch(
    /TaskCreated|SimulatedSent|ReviewRequired|PermittedException|NotApplicable/,
  );
  await page
    .getByRole("tab", { name: "Revision history", exact: true })
    .click();
  await expect(
    page.getByRole("link", {
      name: "Acknowledged by SYN Riley Technician · r01",
      exact: true,
    }),
  ).toHaveAttribute("href", "/documents/44444444-4444-4444-8444-444444444444");
});

test("SV05-I7 first preparation history uses the appointment site timezone", async ({
  page,
}) => {
  const { pack, revision } = await setup(page);
  await page.route(
    `**/api/v1/appointments/${pack.appointment_id}/pack-options`,
    (route) =>
      route.fulfill({
        json: {
          appointment: {
            id: pack.appointment_id,
            version: 1,
            display_number: revision.snapshot.appointment.reference,
            site_timezone: "Australia/Perth",
          },
          work_order_reference: revision.snapshot.work.reference,
          existing_pack_id: null,
          sources: pack.sources,
          history: [
            {
              id: "55555555-5555-4555-8555-555555555555",
              kind: "PriorWork",
              summary: "SYN prior observation",
              confidence: "Reported",
              occurred_at: "2026-09-20T00:00:00.000Z",
              author_label: "SYN Author",
              verification_status: "ReviewRequired",
            },
          ],
        },
      }),
  );
  const ready = page.waitForResponse(
    (r) =>
      r
        .url()
        .endsWith(`/api/v1/appointments/${pack.appointment_id}/pack-options`) &&
      r.status() === 200,
  );
  await page.goto(`/service/packs/new?appointment_id=${pack.appointment_id}`);
  await ready;
  const choices = page.locator("#jp-select-history");
  await expect(choices).toContainText("20 Sep 2026 · 08:00 AWST");
  await expect(choices).toContainText("Review required");
});
