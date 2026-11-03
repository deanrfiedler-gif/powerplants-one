import { test, expect, type Page } from "@playwright/test";
import { navigationForCapabilities } from "../../src/shell/navigation";
import { expectAppointmentRecord } from "../helpers/appointment-record";
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
  await page
    .getByRole("button", { name: "Refresh saved appointment", exact: true })
    .or(
      page.getByRole("menuitem", {
        name: "Refresh saved appointment",
        exact: true,
      }),
    )
    .click();
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
  await page.route("**/api/v1/local-session", (route) =>
    route.fulfill({
      json: {
        actor_id: sv04Id(90),
        workspace_id: sv04Id(91),
        display_name: "Sasha Cole",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (route) =>
    route.fulfill({
      json: {
        display_name: "Sasha Cole",
        preference_scope: "sv04-synthetic",
        can_preview: true,
        actions: [],
        navigation: navigationForCapabilities(
          new Set([
            "schedule.read",
            "shared.read",
            "service.work_order.read",
            "service.ticket.read",
            "activity.read",
            "pack.read",
            "field.read",
          ]),
          false,
        ),
      },
    }),
  );
});
test("SV04 retains the FI06 exact incident handover on desktop and both phones", async ({
  page,
}) => {
  await fixture(page);
  let reads = 0;
  await page.route("**/api/v1/service/incidents/context?*", (route) => {
    expect(
      new URL(route.request().url()).searchParams.get("appointment_id"),
    ).toBe(sv04Id(1));
    reads += 1;
    return route.fulfill({
      json: {
        can_report: true,
        targets: [
          {
            scope_item_id: sv04Id(70),
            asset_id: sv04Id(71),
            task_description: "SYN affected motor",
            display_name: "SYN shade motor",
          },
        ],
      },
    });
  });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(path);
    await expectAppointmentRecord(page, appointmentFixture());
    await page
      .getByRole("button", { name: "Visit more actions", exact: true })
      .click();
    await expect(
      page.getByRole("menuitem", { name: "Report an incident", exact: true }),
    ).toHaveAttribute(
      "href",
      `/service/incidents/new?appointment_id=${sv04Id(1)}&scope_item_id=${sv04Id(70)}&asset_id=${sv04Id(71)}`,
    );
    await page.keyboard.press("Escape");
    if (width <= 780) {
      // Wait for the real record/header before using the shared global menu;
      // a transient loading header must not be the only way to reach Account.
      const more = page.locator("#navigation-toggle");
      await expect(more).toBeVisible();
      await more.click();
      await expect(
        page
          .getByRole("dialog", { name: "More", exact: true })
          .getByRole("button", { name: "Account", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(more).toBeFocused();
    }
  }
  expect(reads).toBe(3);
});

test("SV04 shared record fits desktop, tablet and both phones, with one content scroll and reachable actions", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await fixture(page);
  for (const width of [1440, 1024, 390, 320] as const) {
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
        "This visit's readiness policy does not include customer site readiness.",
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
      const navigation = page.getByRole("navigation", {
        name: "Mobile navigation",
        exact: true,
      });
      await expect(navigation).toBeVisible();
      await expect(navigation.locator("a:visible")).toHaveCount(0);
      await expect(navigation.locator("button:visible")).toHaveCount(1);
      const more = (await page.locator("#navigation-toggle").boundingBox())!;
      expect(more.width).toBeGreaterThanOrEqual(44);
      expect(more.height).toBeGreaterThanOrEqual(44);
      for (const action of await sticky.getByRole("button").all()) {
        const actionBox = (await action.boundingBox())!;
        expect(actionBox.x).toBeGreaterThanOrEqual(more.x + more.width);
      }
      await expect(page.locator("#shell-header")).toContainText(
        "SYN-PPO-APT-000052",
      );
    }
    await page.screenshot({ path: info.outputPath(`held-${width}.png`) });
    // Match the retained full-length Figma frame dimensions as well as usable viewports.
    await page.setViewportSize({
      width,
      height: { 1440: 1739, 1024: 2506, 390: 1696, 320: 1728 }[width]!,
    });
    await page.screenshot({
      path: info.outputPath(`paired-held-${width}.png`),
    });
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
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
  f.appointment.readiness[0].parts = {
    ...f.appointment.readiness[0].parts!,
    outcome: "Pass",
    summary: "1 of 1 line ready for the stated scope",
    lines: f.appointment.readiness[0].parts!.lines.map((line) => ({
      ...line,
      state: "Ready",
      shortage: "0",
      promised_on: "2026-10-13",
    })),
  };
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
  f.appointment.readiness[0].parts = {
    ...f.appointment.readiness[0].parts!,
    outcome: "Blocked",
    summary: "Supplier promise changed; 0 of 1 line ready for the stated scope",
    lines: f.appointment.readiness[0].parts!.lines.map((line) => ({
      ...line,
      state: "At risk",
      shortage: "1",
      promised_on: "2026-10-14",
    })),
  };
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
  await expect(page.locator("#navigation-toggle")).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Dispatch checks", exact: true })
      .getByRole("link"),
  ).toHaveCount(0);
  await expect(page.locator(".sv04-parts-lines")).toHaveCount(0);
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
test("SV04 a delayed ready pack cannot clear a newer appointment hold", async ({
  page,
}, info) => {
  const f = await fixture(page);
  f.appointment.dispatch_hold = false;
  f.pack.readiness = {
    ...f.pack.readiness,
    dispatch_hold: false,
    component_ready: true,
    reasons: [],
  };
  let release = () => {};
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  let delayed = true,
    oldRequests = 0,
    oldCompleted = 0;
  await page.route(`**/api/v1/packs/${sv04Id(40)}`, async (route) => {
    const old = delayed,
      snapshot = structuredClone(f.pack);
    if (old) {
      oldRequests++;
      await wait;
    }
    await route.fulfill({
      json: sv04Envelope(snapshot),
      headers: { "x-sv04-generation": old ? "old" : "current" },
    });
    if (old) oldCompleted++;
  });
  try {
    await page.goto(path);
    await expect.poll(() => oldRequests).toBeGreaterThan(0);
    await expect(
      page.getByRole("heading", { name: "Readiness unavailable", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Loading permitted records…", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open job pack", exact: true }),
    ).toHaveCount(0);
    await page.screenshot({ path: info.outputPath("loading-pack.png") });
    delayed = false;
    f.appointment.dispatch_hold = true;
    f.pack.readiness = {
      ...f.pack.readiness,
      dispatch_hold: true,
      component_ready: false,
      reasons: ["Parts: current supplier promise changed"],
    };
    await refresh(page);
    await expect(
      page.getByText("Parts: current supplier promise changed", {
        exact: true,
      }),
    ).toBeVisible();
    const oldRead = page.waitForResponse(
      (response) => response.headers()["x-sv04-generation"] === "old",
    );
    release();
    await (await oldRead).finished();
    await expect.poll(() => oldCompleted).toBe(oldRequests);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(
      page.getByRole("heading", { name: "Dispatch held", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Ready to dispatch", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Parts: current supplier promise changed", {
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    release();
  }
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

test("SV04 P4 records customer site readiness with all four checks and keeps entries on refusal", async ({
  page,
}) => {
  const f = await fixture(page);
  f.appointment.preparation = {
    policy: {
      id: sv04Id(90),
      reference: "SYN-PPO-PREP-01",
      version: 1,
      synthetic: true,
    },
    schedule_version: f.appointment.schedule_version,
    outcome: "Unknown",
    contact_id: null,
    opens_at: "2026-10-08T03:30:00Z",
    confirmation_due_at: "2026-10-12T03:30:00Z",
    late: false,
    issue_due_at: null,
    calendar_status: "Published lead calendar",
    issue_deadline_blocks_dispatch: false,
  };
  const sent: Record<string, unknown>[] = [];
  await page.route(
    `**/api/v1/appointments/${sv04Id(1)}/contacts`,
    async (route) => {
      sent.push(route.request().postDataJSON());
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
  await page.goto(path);
  const checks = page.getByRole("region", {
    name: "Dispatch checks",
    exact: true,
  });
  await expect(
    checks.getByText(/Not recorded for this schedule/),
  ).toBeVisible();
  await checks
    .getByRole("button", { name: "Record site readiness", exact: true })
    .click();
  const form = page.getByRole("region", {
    name: "Record customer site readiness",
    exact: true,
  });
  await expect(form).toBeVisible();
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await expect(
    form.getByText(
      "Choose Confirmed, Not ready or Not applicable for every check.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(sent).toHaveLength(0);
  await form
    .getByLabel("Access arranged", { exact: true })
    .selectOption("Confirmed");
  await form
    .getByLabel("Power and water available", { exact: true })
    .selectOption("NotApplicable");
  await form
    .getByLabel("Equipment accessible", { exact: true })
    .selectOption("NotReady");
  await form
    .getByLabel("Equipment accessible note", { exact: true })
    .fill("SYN bench under the drive not cleared");
  await form
    .getByLabel("Isolation arrangements agreed", { exact: true })
    .selectOption("Confirmed");
  await expect(
    form.getByText("1 check not ready: dispatch stays held.", { exact: true }),
  ).toBeVisible();
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await expect(
    page.getByText("SYN appointment changed. Review before saving.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0]).toMatchObject({
    purpose: "SiteReadiness",
    outcome: "Confirmed",
    recipient_id: sv04Id(4),
    site_checks: {
      access: { status: "Confirmed", note: "" },
      power_water: { status: "NotApplicable", note: "" },
      equipment: {
        status: "NotReady",
        note: "SYN bench under the drive not cleared",
      },
      isolation: { status: "Confirmed", note: "" },
    },
  });
  await expect(
    form.getByLabel("Equipment accessible", { exact: true }),
  ).toHaveValue("NotReady");
  await form
    .getByRole("button", { name: "Record no answer", exact: true })
    .click();
  await expect.poll(() => sent.length).toBe(2);
  expect(sent[1]).toMatchObject({
    purpose: "SiteReadiness",
    outcome: "NoResponse",
  });
});

test("SV04 P4 shows a reported not-ready check from the latest site-readiness contact", async ({
  page,
}) => {
  const f = await fixture(page);
  f.appointment.preparation = {
    policy: {
      id: sv04Id(90),
      reference: "SYN-PPO-PREP-01",
      version: 1,
      synthetic: true,
    },
    schedule_version: f.appointment.schedule_version,
    outcome: "Blocked",
    contact_id: sv04Id(91),
    opens_at: "2026-10-08T03:30:00Z",
    confirmation_due_at: "2026-10-12T03:30:00Z",
    late: false,
    issue_due_at: null,
    calendar_status: "Published lead calendar",
    issue_deadline_blocks_dispatch: false,
  };
  f.appointment.contacts = [
    {
      ...f.appointment.contacts[0],
      id: sv04Id(91),
      purpose: "SiteReadiness",
      outcome: "Confirmed",
      notes: "",
      site_checks: {
        access: { status: "Confirmed", note: "" },
        power_water: { status: "Confirmed", note: "" },
        equipment: { status: "NotReady", note: "SYN bench in the way" },
        isolation: { status: "NotApplicable", note: "" },
      },
    },
    ...f.appointment.contacts,
  ];
  await page.goto(path);
  await expect(
    page
      .getByRole("region", { name: "Dispatch checks", exact: true })
      .getByText(/reported 1 check not ready/),
  ).toBeVisible();
  await expect(
    page
      .getByText("Site readiness · Not ready", { exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText("Equipment accessible · Not ready · SYN bench in the way", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record again", exact: true }),
  ).toBeVisible();
});

// P4 draft retention: a stale refusal, then a refresh to a genuinely newer saved version.
async function draftAfterStaleRefusal(page: Page, move: boolean) {
  const f = await fixture(page);
  f.appointment.preparation = {
    policy: {
      id: sv04Id(90),
      reference: "SYN-PPO-PREP-01",
      version: 1,
      synthetic: true,
    },
    schedule_version: f.appointment.schedule_version,
    outcome: "Unknown",
    contact_id: null,
    opens_at: "2026-10-08T03:30:00Z",
    confirmation_due_at: "2026-10-12T03:30:00Z",
    late: false,
    issue_due_at: null,
    calendar_status: "Published lead calendar",
    issue_deadline_blocks_dispatch: false,
  };
  const sent: Record<string, unknown>[] = [];
  await page.route(
    `**/api/v1/appointments/${sv04Id(1)}/contacts`,
    async (route) => {
      const body = route.request().postDataJSON();
      sent.push(body);
      if (sent.length === 1)
        return route.fulfill({
          status: 409,
          json: {
            code: "VersionConflict",
            message: "SYN appointment changed. Review before saving.",
            retryable: false,
          },
        });
      return route.fulfill({
        status: 201,
        json: {
          operation_id: body.operation_id,
          record_id: body.id,
          record_version: 1,
          state: "Confirmed",
          receipt_id: sv04Id(95),
          accepted_at: "2026-10-09T01:00:00Z",
        },
      });
    },
  );
  await page.goto(path);
  await page
    .getByRole("region", { name: "Dispatch checks", exact: true })
    .getByRole("button", { name: "Record site readiness", exact: true })
    .click();
  const form = page.getByRole("region", {
    name: "Record customer site readiness",
    exact: true,
  });
  const entries: [string, string][] = [
    ["Access arranged", "Confirmed"],
    ["Power and water available", "NotApplicable"],
    ["Equipment accessible", "NotReady"],
    ["Isolation arrangements agreed", "Confirmed"],
  ];
  for (const [label, value] of entries)
    await form.getByLabel(label, { exact: true }).selectOption(value);
  await form
    .getByLabel("Equipment accessible note", { exact: true })
    .fill("SYN bench under the drive not cleared");
  await form.getByLabel("Note", { exact: true }).fill("SYN spoke to Dana");
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await expect(
    form.getByText("SYN appointment changed. Review before saving.", {
      exact: true,
    }),
  ).toBeVisible();
  // Another actor saved a newer version; the refresh reads it.
  f.appointment.version += 1;
  if (move) {
    f.appointment.schedule_version += 1;
    f.appointment.preparation.schedule_version += 1;
    f.appointment.start_at = "2026-10-14T03:30:00Z";
    f.appointment.end_at = "2026-10-14T06:30:00Z";
  }
  await form
    .getByRole("button", { name: "Refresh saved appointment", exact: true })
    .click();
  await expect(
    form.getByText("SYN appointment changed. Review before saving.", {
      exact: true,
    }),
  ).toHaveCount(0);
  for (const [label, value] of entries)
    await expect(form.getByLabel(label, { exact: true })).toHaveValue(value);
  await expect(
    form.getByLabel("Equipment accessible note", { exact: true }),
  ).toHaveValue("SYN bench under the drive not cleared");
  await expect(form.getByLabel("Note", { exact: true })).toHaveValue(
    "SYN spoke to Dana",
  );
  expect(sent).toHaveLength(1);
  return { f, form, sent };
}

test("SV04 P4 keeps the unsaved draft across a refresh to a newer version and saves only on an explicit record", async ({
  page,
}) => {
  const { f, form, sent } = await draftAfterStaleRefusal(page, false);
  const notice = form.getByRole("status", {
    name: "Review entries against the saved appointment",
  });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("Your entries are kept");
  await expect(notice).toContainText("the visit time has not changed");
  await expect(
    form.getByRole("checkbox", { name: /confirmed these answers again/ }),
  ).toHaveCount(0);
  // Nothing is resubmitted until the user records again.
  await page.waitForTimeout(300);
  expect(sent).toHaveLength(1);
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await expect.poll(() => sent.length).toBe(2);
  expect(sent[1].expected_version).toBe(f.appointment.version);
  expect(sent[0].expected_version).toBe(f.appointment.version - 1);
  expect(sent[1].id).not.toBe(sent[0].id);
  expect(sent[1].operation_id).not.toBe(sent[0].operation_id);
  expect(sent[1].site_checks).toEqual(sent[0].site_checks);
  expect(sent[1].notes).toBe("SYN spoke to Dana");
  await expect(form).toHaveCount(0);
});

test("SV04 P4 keeps the draft for a moved visit but needs reconfirmation before recording it", async ({
  page,
}) => {
  const { f, form, sent } = await draftAfterStaleRefusal(page, true);
  const notice = form.getByRole("status", {
    name: "Visit moved: reconfirm site readiness",
  });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("Tue 13 Oct 2026 · 13:30–16:30");
  await expect(notice).toContainText("Wed 14 Oct 2026 · 13:30–16:30");
  await expect(
    form.getByRole("status", {
      name: "Review entries against the saved appointment",
    }),
  ).toHaveCount(0);
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  const required = form.getByText(
    "Confirm the answers again for the new visit time before recording them.",
    { exact: true },
  );
  await expect(required).toBeVisible();
  const reconfirm = form.getByRole("checkbox", {
    name: "I have confirmed these answers again with the site contact for the new visit time",
    exact: true,
  });
  await expect(reconfirm).toHaveAttribute("aria-invalid", "true");
  expect(sent).toHaveLength(1);
  await reconfirm.check();
  await expect(required).toHaveCount(0);
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await expect.poll(() => sent.length).toBe(2);
  expect(sent[1].expected_version).toBe(f.appointment.version);
  expect(sent[1].site_checks).toEqual(sent[0].site_checks);
});

// #750 re-review: a reconfirmation belongs to the schedule it was given for. The box is ticked for
// the first move; before anything is sent the visit moves again and the user refreshes from the
// page actions. The tick does not carry over, and nothing is sent until the new time is reconfirmed.
test("SV04 P4 reconfirmation does not carry over to a second move of the visit", async ({
  page,
}) => {
  const { f, form, sent } = await draftAfterStaleRefusal(page, true);
  const reconfirm = form.getByRole("checkbox", {
    name: "I have confirmed these answers again with the site contact for the new visit time",
    exact: true,
  });
  await reconfirm.check();
  // Another actor moves the visit again before the user records anything.
  f.appointment.version += 1;
  f.appointment.schedule_version += 1;
  f.appointment.preparation!.schedule_version += 1;
  f.appointment.start_at = "2026-10-15T03:30:00Z";
  f.appointment.end_at = "2026-10-15T06:30:00Z";
  await refresh(page);
  const notice = form.getByRole("status", {
    name: "Visit moved: reconfirm site readiness",
  });
  await expect(notice).toContainText("Thu 15 Oct 2026 · 13:30–16:30");
  // The tick given for 14 October does not count for 15 October.
  await expect(reconfirm).not.toBeChecked();
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await expect(
    form.getByText(
      "Confirm the answers again for the new visit time before recording them.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.waitForTimeout(300);
  expect(sent).toHaveLength(1);
  await reconfirm.check();
  await form
    .getByRole("button", { name: "Record confirmation", exact: true })
    .click();
  await expect.poll(() => sent.length).toBe(2);
  expect(sent[1].expected_version).toBe(f.appointment.version);
  expect(sent[1].site_checks).toEqual(sent[0].site_checks);
});
