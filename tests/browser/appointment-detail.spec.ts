import { test, expect, type Page } from "@playwright/test";
import { navigationForCapabilities } from "../../src/shell/navigation";
import {
  appointmentFixture,
  appointmentPackFixture,
  sv04Envelope,
  sv04Id,
} from "../helpers/appointment-detail-fixture";
const path = `/service/appointments/${sv04Id(1)}`;
async function fixture(page: Page) {
  const f = {
    appointment: appointmentFixture(),
    pack: appointmentPackFixture(),
    denied: false,
    failed: false,
    packDenied: false,
    empty: false,
  };
  let read = 0;
  await page.route(`**/api/v1/appointments/${sv04Id(1)}`, (route) =>
    route.fulfill({
      status: f.denied ? 403 : f.failed ? 503 : 200,
      json: f.denied
        ? {
            code: "Forbidden",
            message: "Appointment unavailable to this identity",
          }
        : f.failed
          ? { code: "Unavailable", message: "Synthetic read failed" }
          : {
              ...sv04Envelope(
                f.appointment,
                new Date(Date.UTC(2026, 9, 13, 22, 12, ++read)).toISOString(),
              ),
              items: f.empty ? [] : [f.appointment],
            },
    }),
  );
  await page.route(`**/api/v1/appointments/${sv04Id(1)}/pack`, (route) =>
    route.fulfill({
      status: f.packDenied ? 403 : 200,
      json: f.packDenied
        ? { code: "Forbidden", message: "Pack not available" }
        : {
            pack: {
              id: f.pack.id,
              display_number: f.pack.display_number,
              status: f.pack.status,
              needs_review: f.pack.needs_review,
            },
            can_prepare: true,
          },
    }),
  );
  await page.route(`**/api/v1/packs/${sv04Id(40)}`, (route) =>
    route.fulfill({ json: sv04Envelope(f.pack) }),
  );
  return f;
}
async function refresh(page: Page) {
  const menu = page.getByRole("button", {
    name: "Appointment actions",
    exact: true,
  });
  if (await menu.isVisible()) await menu.click();
  else
    await page
      .locator("#shell-header")
      .getByRole("button", { name: /More/ })
      .click();
  await page.getByRole("button", { name: "Refresh saved appointment", exact: true }).or(page.getByRole("menuitem", { name: "Refresh saved appointment", exact: true })).click();
}
test.beforeEach(async ({ page }) => {
  // Preserve layout while keeping Font Awesome Pro artwork out of retained evidence.
  await page.addInitScript(() =>
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = ".ppo-fa,svg{visibility:hidden!important}";
      document.head.append(style);
    }),
  );
  // This suite proves rendered state/commands, not authentication or database authority.
  // Keep presentation fixtures independent of destructive database upgrade suites.
  await page.route("**/api/v1/local-session", route => route.fulfill({json:{actor_id:sv04Id(90),workspace_id:sv04Id(91),display_name:"Sasha Cole"}}));
  await page.route("**/api/v1/shell/context",route => route.fulfill({json:{display_name:"Sasha Cole",preference_scope:"sv04-synthetic",can_preview:true,actions:[],navigation:navigationForCapabilities(new Set(["schedule.read","shared.read","service.work_order.read","service.ticket.read","activity.read","pack.read","field.read"]))}}));
});
test("SV04 shared record fits desktop, tablet and both phones, with one content scroll and reachable actions", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await fixture(page);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Job pack r04", exact: true }),
    ).toBeVisible();
    if (width === 1024) {
      const collapse = page.getByRole("button", {
        name: "Collapse primary navigation",
        exact: true,
      });
      if (await collapse.isVisible()) await collapse.click();
    }
    await expect(
      page.getByRole("heading", { name: "Dispatch held", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("#ppo-appointment")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Record again", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText(
        "Customer site-readiness recording is not available yet.",
        { exact: false },
      ),
    ).toBeVisible();
    if (width < 781) {
      const sticky = page.locator(".shared-record-sticky");
      await expect(sticky).toBeVisible();
      const box = (await sticky.boundingBox())!;
      expect(box.y + box.height).toBeCloseTo(844, 0);
      expect(
        (await sticky
          .getByRole("button", { name: "Record contact", exact: true })
          .boundingBox())!.height,
      ).toBeGreaterThanOrEqual(44);
      await expect(
        page.getByRole("navigation", {
          name: "Mobile navigation",
          exact: true,
        }),
      ).toBeHidden();
      await expect(page.locator("#shell-header")).toContainText(
        "SYN-PPO-APT-000052",
      );
    }
    await page.screenshot({ path: info.outputPath(`held-${width}.png`) });
    await page.locator(".sv04-integrity summary").scrollIntoViewIfNeeded();
    await page.locator(".sv04-integrity summary").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".sv04-integrity")).toHaveAttribute("open", "");
    await page.screenshot({ path: info.outputPath(`details-${width}.png`) });
  }
});
test("SV04 ready, supply hold, proposed and cancelled preserve dates and command authority", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const f = await fixture(page);
  f.appointment.dispatch_hold = false;
  f.appointment.readiness[0].outcome = "Pass";
  f.pack.readiness = {
    ...f.pack.readiness,
    dispatch_hold: false,
    component_ready: true,
    reasons: [],
    recipients: f.pack.readiness.recipients.map((r) => ({
      ...r,
      acknowledged_at: "2026-10-13T00:00:00Z",
      presented_hash: f.pack.issues[0].output_hash,
    })),
  };
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Ready to dispatch", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("ready-390.png") });
  const start = f.appointment.start_at;
  f.appointment.dispatch_hold = true;
  f.appointment.readiness[0].outcome = "Blocked";
  f.pack.readiness.dispatch_hold = true;
  f.pack.readiness.component_ready = false;
  f.pack.readiness.reasons = ["Parts: supplier promise changed; line at risk"];
  await refresh(page);
  await expect(
    page.getByText(f.pack.readiness.reasons[0], { exact: true }),
  ).toBeVisible();
  expect(f.appointment.start_at).toBe(start);
  await page.screenshot({ path: info.outputPath("supply-held-390.png") });
  f.appointment.status = "Proposed";
  f.appointment.assignments = [];
  f.appointment.customer_commitment = "Pending";
  await refresh(page);
  await expect(
    page.getByRole("heading", { name: "Not confirmed yet", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".shared-record-sticky")
      .getByRole("button", { name: "Confirm appointment", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("proposed-390.png") });
  f.appointment.status = "Cancelled";
  f.appointment.cancellation_reason =
    "SYN cancelled by coordinator; retained evidence only";
  await refresh(page);
  await expect(
    page.getByRole("heading", { name: "Cancelled", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".shared-record-sticky")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /^(Record contact|Move or reassign|Confirm appointment|Cancel appointment)$/,
    }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("cancelled-390.png") });
});
test("SV04 failed refresh keeps evidence but removes commands; denial clears it; partial pack cannot pass", async ({
  page,
}, info) => {
  const f = await fixture(page);
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Job pack r04", exact: true }),
  ).toBeVisible();
  f.failed = true;
  await refresh(page);
  await expect(
    page.getByText("Synthetic read failed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Readiness unavailable", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record contact", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Open job pack", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("failed-refresh.png") });
  f.failed = false;
  f.packDenied = true;
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(
    page.getByText("Job pack access is unavailable to this identity.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ready to dispatch", exact: true }),
  ).toHaveCount(0);
  f.denied = true;
  await refresh(page);
  await expect(
    page.getByText("Appointment unavailable to this identity", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#ppo-appointment")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("no-access.png") });
  f.denied = false;
  f.empty = true;
  await page
    .getByRole("button", { name: "Retry loading", exact: true })
    .click();
  await expect(
    page.getByText("No appointment is available in this response.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("SV04 contact stale refusal retains entries; uncertain save retries the exact original", async ({
  page,
}) => {
  await fixture(page);
  let uncertain = false;
  const sent: Record<string, unknown>[] = [];
  await page.route(
    `**/api/v1/appointments/${sv04Id(1)}/contacts`,
    async (route) => {
      sent.push(route.request().postDataJSON());
      if (uncertain) await route.abort();
      else
        await route.fulfill({
          status: 409,
          json: {
            code: "VersionConflict",
            message: "SYN appointment changed. Review before saving.",
            retryable: false,
          },
        });
    },
  );
  await page.route("**/api/v1/operations/*", (route) =>
    route.fulfill({
      status: 503,
      json: {
        code: "Unavailable",
        message: "SYN receipt unavailable",
        retryable: true,
      },
    }),
  );
  await page.goto(path);
  await page
    .getByRole("button", { name: "Record contact", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  const notes = page.getByLabel("Contact notes", { exact: true });
  await notes.fill("SYN confirmed these dates by phone.");
  const save = page.getByRole("button", {
    name: "Save contact outcome",
    exact: true,
  });
  await save.click();
  await expect(
    page.getByText("SYN appointment changed. Review before saving.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(notes).toHaveValue("SYN confirmed these dates by phone.");
  uncertain = true;
  await save.click();
  await expect(
    page
      .getByRole("region", { name: "Original operation recovery", exact: true })
      .first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retry unchanged original", exact: true })
    .first()
    .click();
  await expect.poll(() => sent.length).toBe(3);
  expect(sent[2]).toEqual(sent[1]);
  expect(sent[0].recipient_id).toBe(sv04Id(4));
});
