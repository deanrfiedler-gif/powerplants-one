import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { changesFixture, changesId } from "../helpers/changes-follow-up";
import { destinations } from "../../src/shell/navigation";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const address = "/schedule/changes?department=service&day=2031-09-22";
async function fixture(page: Page, a = changesFixture()) {
  await page.route("**/*fontawesome*", (r) => r.abort());
  await page.route("**/api/v1/**", (r) =>
    r.fulfill({
      status: 403,
      json: {
        code: "Forbidden",
        message: "Source unavailable in synthetic fixture",
      },
    }),
  );
  await page.route("**/api/v1/local-session", (r) =>
    r.fulfill({
      json: {
        actor_id: changesId(12),
        workspace_id: changesId(20),
        display_name: "SYN Service coordinator",
      },
    }),
  );
  await page.route("**/api/v1/shell/context", (r) =>
    r.fulfill({
      json: {
        display_name: "SYN Service coordinator",
        preference_scope: "pl04-fixture",
        actions: [],
        navigation: destinations.map((d) => d.id),
        can_preview: true,
      },
    }),
  );
  await page.route("**/api/v1/sites?*", (r) =>
    r.fulfill({
      json: { items: [{ id: a.site_id, display_name: a.site_name }] },
    }),
  );
  await page.route("**/api/v1/schedule/changes?*", (r) =>
    r.fulfill({
      json: {
        items: [a],
        observed_at: a.observed_at,
        completeness: "Complete",
        focused: new URL(r.request().url()).searchParams.has("appointment_id"),
      },
    }),
  );
  await page.route("**/api/v1/schedule/changes/" + a.id, (r) =>
    r.fulfill({ json: a }),
  );
  await page.route("**/api/v1/appointments/*/booking-policy?*", (r) =>
    r.fulfill({
      json: {
        family_head_version: 1,
        selected_policy: {
          id: a.policy.id,
          version: 1,
          content_hash: "synthetic",
        },
        policy: {
          ...a.policy,
          content_hash: "synthetic",
          family_head_version: 1,
        },
      },
    }),
  );
}
async function capture(page: Page, info: TestInfo, name: string) {
  await expect(page.locator(".ppo-fa")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const root = process.env.PPO_PL04_EVIDENCE;
  if (root) await mkdir(root, { recursive: true });
  await page.screenshot({
    path: root ? join(root, name + ".png") : info.outputPath(name + ".png"),
    fullPage: true,
  });
}
test("PL-04 register, snapshot and follow-up at desktop, tablet, 390 and 320", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  await fixture(page);
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 900 : 844 });
    await page.goto(address);
    await expect(
      page.locator(
        width > 780 ? ".changes-desktop-grid" : ".changes-phone-list",
      ),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await capture(page, info, "queue-" + width);
    await page
      .locator(width > 780 ? ".changes-link" : ".changes-phone-list button")
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Shade screen motor replacement" }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Accept and check move", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("Gate P4 is not built.", { exact: false }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 781)
      await page.setViewportSize({
        width,
        height: width === 320 ? 2225 : 1933,
      });
    await capture(page, info, "review-" + width);
    if (width < 781) await page.setViewportSize({ width, height: 844 });
    await page.getByRole("tab", { name: /Follow-up/ }).click();
    await expect(
      page.getByRole("link", { name: "Open in My Work" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Record customer contact", exact: true }),
    ).toHaveAttribute("href", /action=contact/);
    if (width === 1440) await capture(page, info, "followup-1440");
    await page
      .getByRole("button", { name: "Close visit review", exact: true })
      .click();
    await expect(
      page
        .locator(width > 780 ? ".changes-link" : ".changes-phone-list button")
        .first(),
    ).toBeFocused();
  }
});
test("PL-04 stale reason, cancel menu, unknown evidence and view-only permission", async ({
  page,
}, info) => {
  const a = changesFixture();
  a.schedule_version = 8;
  a.consequences = {
    state: "Unavailable",
    pack: null,
    dispatch_hold: null,
    reasons: [],
  };
  await fixture(page, a);
  await page.goto(address + "&selected_id=" + a.id);
  await expect(
    page.getByText("The booking schedule version changed.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Job-pack evidence unavailable", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("Customer agreed the requested date");
  await expect(
    page.getByRole("button", { name: "Accept and check move", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Request actions", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Cancel request", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Request actions", exact: true }),
  ).toBeFocused();
  await capture(page, info, "stale");
  page.on("dialog", (d) => d.accept());
  a.actions = { can_manage: false, can_request: false, can_contact: false };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByText("View only —", { exact: false })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept and check move", exact: true }),
  ).toHaveCount(0);
  await capture(page, info, "view-only");
});
test("PL-04 failed or loading reads remove prior results and counts; empty is distinct", async ({
  page,
}, info) => {
  await fixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(address);
  await expect(page.locator(".changes-phone-list")).toBeVisible();
  await page.route("**/api/v1/schedule/changes?*", (r) =>
    r.fulfill({ status: 503, json: { message: "Synthetic read failure" } }),
  );
  await page
    .getByRole("button", { name: "Refresh review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Could not load visits" }),
  ).toBeVisible();
  await expect(page.locator(".changes-phone-list")).toHaveCount(0);
  await expect(page.locator(".changes-read")).toHaveText(
    "Current results unconfirmed",
  );
  await capture(page, info, "error-390");
  let release!: () => void;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  await page.route("**/api/v1/schedule/changes?*", async (r) => {
    await pending;
    await r.fulfill({
      json: {
        items: [],
        observed_at: changesFixture().observed_at,
        completeness: "Complete",
      },
    });
  });
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(
    page.getByRole("heading", { name: "Loading visits…" }),
  ).toBeVisible();
  await capture(page, info, "loading-390");
  release();
  await expect(
    page.getByRole("heading", { name: "No visits in Needs review" }),
  ).toBeVisible();
  await capture(page, info, "empty-390");
});
test("PL-04 exact handover bypasses queue and period without contaminating counts", async ({
  page,
}, info) => {
  const a = changesFixture();
  await fixture(page, a);
  await page.route("**/api/v1/schedule/changes?*", (r) =>
    r.fulfill({
      json: {
        items: new URL(r.request().url()).searchParams.has("appointment_id")
          ? [a]
          : [],
        observed_at: a.observed_at,
        completeness: "Complete",
      },
    }),
  );
  await page.goto(address + "&queue=cancellations&appointment_id=" + a.id);
  await expect(
    page.getByText("Exact appointment handover", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".changes-link")).toBeVisible();
  await expect(page.locator("#changes-menu .mw-badge").first()).toHaveText("0");
  await capture(page, info, "exact-1440");
  await page
    .getByRole("button", { name: "Return to review queue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No visits in Cancellations" }),
  ).toBeVisible();
});
test("PL-04 Policy impact retains temporary inputs, result handover and separate saved workflow", async ({
  page,
}, info) => {
  const a = changesFixture();
  await fixture(page, a);
  await page.route("**/api/v1/schedule/policy-impact*", (r) => {
    const compared = new URL(r.request().url()).searchParams.has(
      "max_visit_minutes",
    );
    return r.fulfill({
      json: {
        policy: {
          ...a.policy,
          max_visit_minutes: 480,
          effective_from: "2031-01-01T00:00:00Z",
          effective_to: "2032-01-01T00:00:00Z",
          evidence: "Synthetic policy evidence",
          content_hash: "synthetic",
        },
        scenario: compared
          ? {
              max_visit_minutes: 90,
              effective_from: "2031-09-24T00:00:00Z",
              content_hash: "synthetic-scenario",
            }
          : null,
        observed_at: a.observed_at,
        completeness: "Bounded synthetic comparison",
        compared: compared ? 1 : 0,
        items: compared
          ? [
              {
                ...a,
                service_owner_name: "Sam Patel",
                reasons: ["DurationLimitExceeded"],
              },
            ]
          : [],
      },
    });
  });
  await page.goto("/schedule/policy-impact?department=service&day=2031-09-22");
  await page
    .getByLabel("Proposed maximum visit (minutes)", { exact: true })
    .fill("90");
  await page.getByRole("button", { name: "Compare future bookings" }).click();
  await expect(
    page.getByText("1 requiring review from 1 compared bookings."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: a.display_number, exact: true }),
  ).toHaveAttribute("href", /appointment_id=/);
  await capture(page, info, "policy-1440");
  await page
    .getByLabel("Proposed maximum visit (minutes)", { exact: true })
    .fill("120");
  await expect(
    page.getByRole("heading", { name: "Bookings requiring review" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Saved policy reviews, publication and holds", {
      exact: true,
    }),
  ).toBeVisible();
});

test("PL-04 uncertain acceptance retries the original command and shows the saved decision", async ({
  page,
}, info) => {
  const a = changesFixture();
  await fixture(page, a);
  const bodies: Record<string, unknown>[] = [];
  await page.route(
    "**/api/v1/schedule-change-requests/*/accept",
    async (route) => {
      const body = route.request().postDataJSON();
      bodies.push(body);
      if (bodies.length === 1) {
        await route.abort("failed");
        return;
      }
      a.version++;
      a.schedule_version++;
      a.assignment_version++;
      a.start_at = a.requests[0].proposed_start;
      a.end_at = a.requests[0].proposed_end;
      a.assignments.push({
        ...a.assignments[0],
        ...a.requests[0].crew[0],
        id: changesId(30),
        assignment_version: a.assignment_version,
      });
      a.history.unshift({
        ...a.history[0],
        version: a.version,
        snapshot: {
          ...a.history[0].snapshot,
          start_at: a.start_at,
          end_at: a.end_at,
          schedule_version: a.schedule_version,
          assignment_version: a.assignment_version,
          updated_at: "2031-09-22T23:20:00Z",
        },
      });
      Object.assign(a.requests[0], {
        version: 2,
        status: "Accepted",
        decision_reason: body.reason,
        decision_at: "2031-09-22T23:20:01Z",
        decision_by_name: "Sam Patel",
      });
      await route.fulfill({
        json: {
          receipt: { operation_id: body.operation_id, state: "Accepted" },
        },
      });
    },
  );
  await page.goto(address + "&selected_id=" + a.id);
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("Customer confirmed Thursday; complete booking check requested.");
  await page
    .getByRole("button", { name: "Accept and check move", exact: true })
    .click();
  await expect(
    page.getByLabel("Decision reason", { exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Accept and check move", exact: true })
    .click();
  await expect(
    page.getByText("Move accepted · decision saved.", { exact: false }),
  ).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toEqual(bodies[0]);
  expect(bodies[0].expected_version).toBe(6);
  expect(bodies[0].expected_request_version).toBe(1);
  await expect(
    page.getByRole("heading", { name: "Shade screen motor replacement" }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Record customer contact", exact: true }),
  ).toHaveAttribute("href", /action=contact/);
  await capture(page, info, "accepted-1440");
});
