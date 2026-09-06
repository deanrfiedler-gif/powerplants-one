import { test, expect, type Page } from "@playwright/test";
const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function identity(page: Page, profile = "coordinator") {
  await page.getByLabel("Identity", { exact: true }).selectOption(profile);
  await page
    .getByRole("button", { name: "Use this identity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Use this identity", exact: true }),
  ).toBeEnabled();
}
async function capture(
  page: Page,
  info: { outputPath: (s: string) => string },
  name: string,
) {
  await expect(
    page.getByText("Loading permitted records…", { exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("P05-" + name + ".png"),
    fullPage: true,
  });
}
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch("/api/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: body
      ? { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" }
      : {},
    data: body,
  });
  const data = await r.json();
  expect(r.ok(), JSON.stringify(data)).toBeTruthy();
  return data;
}
const base = () => ({
  operation_id: crypto.randomUUID(),
  schema_version: 1,
  reason: "SYN browser fixture through public API",
});
const member = (n = 1, role = "Lead") => ({
  resource_id: id("a4", n),
  resource_version: 1,
  calendar_version: 1,
  crew_role: role,
  travel_before_minutes: 0,
  travel_after_minutes: 0,
  travel_reason: "SYN reviewed zero travel allowance at the fictional site.",
});
function versions(a: Record<string, unknown>) {
  return {
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"),
    scheduling_policy_version: 1,
  };
}
async function ready(page: Page, day: string, confirm = false) {
  const order = (await call(page, "service/work-orders/" + id("a9"))).items[0],
    aid = crypto.randomUUID();
  await call(page, `service/work-orders/${order.id}/visits`, {
    ...base(),
    id: aid,
    expected_version: order.version,
    scope_revision_id: id("aa"),
    scope_version: 1,
    start_at: day + "T00:00:00Z",
    end_at: day + "T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  let a = (await call(page, "appointments/" + aid)).items[0];
  await call(page, `service/work-orders/${order.id}/readiness`, {
    ...base(),
    expected_version: a.work_order_version,
    assessment: {
      scope_revision_id: id("aa"),
      scope_version: 1,
      appointment_id: aid,
      criterion_code: "ToolPreparation",
      outcome: "Pass",
      reason: "SYN exact browser fixture preparation review",
      source_as_at: "2026-09-05T00:00:00Z",
      evidence: {
        title: "SYN browser preparation",
        content_text:
          "SYN inspection kit and owned preparation ready for booking; dispatch remains held.",
        source_reference: "SYN-PPO-BROWSER-P05",
        source_version: "1",
      },
    },
  });
  if (confirm) {
    await call(page, `appointments/${aid}/contacts`, {
      ...base(),
      id: crypto.randomUUID(),
      expected_version: a.version,
      recipient_id: id("60"),
      channel: "Simulated",
      outcome: "Confirmed",
      occurred_at: new Date().toISOString(),
      notes: "SYN customer agreed to these exact dates.",
    });
    a = (await call(page, "appointments/" + aid)).items[0];
    await call(page, `appointments/${aid}/confirm`, {
      ...base(),
      ...versions(a),
      crew: [member(), member(2, "Technician")],
    });
  }
  return aid;
}
async function fillCrew(page: Page, two = true) {
  const form = page.getByRole("region", {
    name: "Confirm appointment",
    exact: true,
  });
  await form.getByLabel("Resource 1", { exact: true }).selectOption(id("a4"));
  await form.getByLabel("Travel before 1 (minutes)").fill("0");
  await form.getByLabel("Travel after 1 (minutes)").fill("0");
  await form
    .getByLabel("Travel basis 1")
    .fill("SYN explicit zero allowance for fictional same-site visit.");
  if (two) {
    await form.getByRole("button", { name: "Add crew member" }).click();
    await form
      .getByLabel("Resource 2", { exact: true })
      .selectOption(id("a4", 2));
    await form.getByLabel("Travel before 2 (minutes)").fill("0");
    await form.getByLabel("Travel after 2 (minutes)").fill("0");
    await form
      .getByLabel("Travel basis 2")
      .fill("SYN explicit zero allowance for fictional same-site visit.");
  }
  await form
    .getByLabel("Booking reason")
    .fill("SYN reviewed authorised inspection and full crew.");
}
test("P05 SC-07 day/week lanes, explicit filters, empty/error and keyboard focus", async ({
  page,
}, info) => {
  await page.goto("/schedule");
  await identity(page);
  await expect(
    page.getByRole("heading", { name: "Service planner", exact: true }),
  ).toBeVisible();
  await capture(page, info, "week");
  if (info.project.name.startsWith("mobile")) {
    const strip = page.getByRole("region", {
      name: "SYN Alex Lead days",
      exact: true,
    });
    await strip.focus();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => strip.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
    await capture(page, info, "week-keyboard-scroll");
  }
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await capture(page, info, "day");
  const move = page
    .getByRole("button", { name: "Move or reassign", exact: true })
    .first();
  await move.focus();
  await expect(move).toBeFocused();
  await capture(page, info, "keyboard-focus");
  await move.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture(page, info, "keyboard-move-form");
  await page.getByRole("button", { name: "Close move", exact: true }).click();
  await page.getByLabel("Starting date").fill("2027-02-01");
  await expect(
    page.getByText(
      "No permitted appointments in this period. Resource evidence still applies.",
    ),
  ).toBeVisible();
  await capture(page, info, "empty");
  await page.route("**/api/v1/schedule?*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "DependencyUnavailable",
        message: "SYN unavailable planner read",
        retryable: true,
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Refresh planner", exact: true })
    .click();
  await expect(
    page.getByText(/Availability is unknown. A failed read/),
  ).toBeVisible();
  await capture(page, info, "read-failure");
  await page.unroute("**/api/v1/schedule?*");
  await identity(page, "systems");
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "permission",
  );
  await capture(page, info, "systems-refusal");
});
test("P05 SC-08 contact refusal, owned failure, exact agreement, full crew confirmation and cancellation", async ({
  page,
}, info) => {
  await page.goto("/schedule");
  await identity(page);
  const aid = await ready(
    page,
    info.project.name.startsWith("mobile") ? "2026-10-02" : "2026-10-01",
  );
  await page.goto("/service/appointments/" + aid);
  await page
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  await fillCrew(page);
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(page.locator(".business-error[role=alert]")).toContainText(
    "customer agreement",
  );
  await expect(page.getByLabel("Booking reason")).toHaveValue(
    "SYN reviewed authorised inspection and full crew.",
  );
  await capture(page, info, "contact-refusal-input-retained");
  await page
    .getByRole("button", { name: "Record contact", exact: true })
    .click();
  await page.getByLabel("Contact outcome").selectOption("Failed");
  await page
    .getByLabel("Contact notes")
    .fill(
      "SYN contact attempt failed. Coordinator retains the owned follow-up; no agreement inferred.",
    );
  await page.getByRole("button", { name: "Save contact outcome" }).click();
  await expect(
    page.getByText("Contact outcome saved.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Owned follow-up" }),
  ).toBeVisible();
  await capture(page, info, "failed-contact-owned");
  await page.getByLabel("Contact outcome").selectOption("Confirmed");
  await page
    .getByLabel("Contact notes")
    .fill(
      "SYN customer explicitly agrees to the displayed visit dates. No email or SMS sent; this does not acknowledge a job pack.",
    );
  await page.getByRole("button", { name: "Save contact outcome" }).click();
  await expect(
    page.getByText("Contact outcome saved.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  await fillCrew(page);
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Move or reassign", exact: true }),
  ).toBeVisible();
  await capture(page, info, "confirmed-crew");
  await page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await page
    .getByLabel("Cancellation reason")
    .fill(
      "SYN customer defers planned inspection; release all future crew reservations and retain history.",
    );
  await page.getByRole("button", { name: "Cancel future appointment" }).click();
  await expect(
    page.getByText(/Cancellation reason: SYN customer defers/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Move or reassign", exact: true }),
  ).toHaveCount(0);
  await capture(page, info, "cancelled");
  const current = (await call(page, "appointments/" + aid)).items[0];
  expect(
    current.assignments.filter((x: { active: boolean }) => x.active),
  ).toHaveLength(0);
  expect(current.history.length).toBeGreaterThan(3);
});
test("P05 controlled move conflict keeps original position; uncertain accepted result retries unchanged once", async ({
  page,
}, info) => {
  await page.goto("/schedule");
  await identity(page);
  const day = info.project.name.startsWith("mobile")
      ? "2026-10-08"
      : "2026-10-07",
    aid = await ready(page, day, true);
  await page.getByLabel("Starting date").fill(day);
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /SYN-PPO-APT/ }).first(),
  ).toBeVisible();
  const lane = page.getByRole("region", {
    name: "SYN Alex Lead resource lane",
    exact: true,
  });
  if (info.project.name.startsWith("desktop")) {
    const card = lane
      .locator(".appointment-card")
      .filter({ has: page.locator(`a[href="/service/appointments/${aid}"]`) });
    await card.dragTo(lane.locator('[data-day="2026-10-09"]'));
    await expect(page.getByRole("dialog")).toBeVisible();
    await capture(page, info, "drag-proposal");
  } else {
    await lane
      .getByRole("button", { name: "Move or reassign", exact: true })
      .first()
      .focus();
    await page.keyboard.press("Enter");
  }
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Start (site time)").fill("2026-10-10T10:00");
  await dialog.getByLabel("Finish (site time)").fill("2026-10-10T12:00");
  await dialog
    .getByLabel("Change reason")
    .fill("SYN attempted weekend move must retain the original booking.");
  await dialog.getByRole("button", { name: "Save proposed move" }).click();
  await expect(dialog.locator(".business-error[role=alert]")).toContainText(
    "published working interval",
  );
  await expect(dialog.getByLabel("Start (site time)")).toHaveValue(
    "2026-10-10T10:00",
  );
  expect((await call(page, "appointments/" + aid)).items[0].start_at).toContain(
    day,
  );
  await capture(page, info, "rejected-move-retained");
  const observed = (await call(page, "appointments/" + aid)).items[0];
  await call(page, `appointments/${aid}/contacts`, {
    ...base(),
    id: crypto.randomUUID(),
    expected_version: observed.version,
    recipient_id: id("60"),
    channel: "Simulated",
    outcome: "Attempted",
    occurred_at: new Date().toISOString(),
    notes:
      "SYN another session recorded a contact attempt while this move form was open.",
  });
  await dialog.getByRole("button", { name: "Save proposed move" }).click();
  await expect(dialog.locator(".business-error[role=alert]")).toContainText(
    "changed",
  );
  await expect(dialog.getByLabel("Start (site time)")).toHaveValue(
    "2026-10-10T10:00",
  );
  await dialog
    .getByRole("button", { name: "Review saved appointment", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Use reviewed current versions" }),
  ).toBeEnabled();
  await capture(page, info, "stale-move-current-review");
  await dialog
    .getByRole("button", { name: "Use reviewed current versions" })
    .click();
  await dialog.getByLabel("Start (site time)").fill("2026-09-21T10:00");
  await dialog.getByLabel("Finish (site time)").fill("2026-09-21T12:00");
  await dialog.getByRole("button", { name: "Save proposed move" }).click();
  await expect(dialog.locator(".business-error[role=alert]")).toContainText(
    "reserved",
  );
  expect((await call(page, "appointments/" + aid)).items[0].start_at).toContain(
    day,
  );
  await capture(page, info, "crew-conflict-original-retained");
  const target = info.project.name.startsWith("mobile")
    ? "2026-10-13"
    : "2026-10-12";
  await dialog.getByLabel("Start (site time)").fill(target + "T10:00");
  await dialog.getByLabel("Finish (site time)").fill(target + "T12:00");
  await dialog
    .getByLabel("Change reason")
    .fill("SYN controlled weekday move; contact and pack review remain owned.");
  let intercepted = false;
  await page.route(`**/api/v1/appointments/${aid}/move`, async (route) => {
    if (!intercepted) {
      intercepted = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await dialog.getByRole("button", { name: "Save proposed move" }).click();
  await expect(dialog.locator(".business-error[role=alert]")).toContainText(
    "could not be confirmed",
  );
  await capture(page, info, "uncertain-move-retry");
  await dialog.getByRole("button", { name: "Save proposed move" }).click();
  await expect(
    dialog.getByText("Appointment saved. Dispatch remains held.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute(`**/api/v1/appointments/${aid}/move`);
  const current = (await call(page, "appointments/" + aid)).items[0];
  expect(current.assignment_version).toBe(3);
  expect(current.customer_commitment).toBe("Changed");
  expect(current.pack_requirement).toBe("ReviewRequired");
  await capture(page, info, "move-saved-review-held");
});
test("P05 project requests reject then accept through keyboard; technician request cannot confirm", async ({
  page,
}, info) => {
  await page.goto("/schedule");
  await identity(page);
  const aid = await ready(
    page,
    info.project.name.startsWith("mobile") ? "2026-10-16" : "2026-10-15",
    true,
  );
  await page.goto("/service/appointments/" + aid);
  await page
    .getByRole("button", { name: "Propose change", exact: true })
    .click();
  const form = page.getByRole("region", {
    name: "Propose a schedule change",
    exact: true,
  });
  await form.getByLabel("Request source").selectOption("ProjectReference");
  await form.getByLabel("Source reference").fill("SYN-PPO-PROJECT-PLANNER");
  await form.getByLabel("Source version").fill("1");
  await form.getByLabel("Start (site time)").fill("2026-10-19T10:00");
  await form.getByLabel("Finish (site time)").fill("2026-10-19T12:00");
  await form
    .getByLabel("Change reason")
    .fill(
      "SYN project requests revised attendance. " +
        "Retain approved scope, customer contact and full crew review. ".repeat(
          8,
        ),
    );
  await form.getByRole("button", { name: "Save change request" }).click();
  await expect(
    page.getByText("Change request saved. Existing booking retained.", {
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, info, "project-pending-long-content");
  let request = page.locator(".change-request").first();
  await request
    .getByLabel("Decision reason")
    .fill("SYN first requested date is declined by dispatcher.");
  await request.getByRole("button", { name: "Reject request" }).focus();
  await page.keyboard.press("Enter");
  await expect(request.getByText("Rejected", { exact: true })).toBeVisible();
  await capture(page, info, "project-rejected");
  await page
    .getByRole("button", { name: "Close proposal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Propose change", exact: true })
    .click();
  const fresh = page.getByRole("region", {
    name: "Propose a schedule change",
    exact: true,
  });
  await fresh.getByLabel("Request source").selectOption("ProjectReference");
  await fresh.getByLabel("Source reference").fill("SYN-PPO-PROJECT-PLANNER");
  await fresh.getByLabel("Source version").fill("2");
  const target = info.project.name.startsWith("mobile")
    ? "2026-10-21"
    : "2026-10-20";
  await fresh.getByLabel("Start (site time)").fill(target + "T10:00");
  await fresh.getByLabel("Finish (site time)").fill(target + "T12:00");
  await fresh
    .getByLabel("Change reason")
    .fill(
      "SYN second project request; dispatcher must recheck and accept explicitly.",
    );
  await fresh.getByRole("button", { name: "Save change request" }).click();
  await expect(
    page.getByText("Change request saved. Existing booking retained.", {
      exact: true,
    }),
  ).toBeVisible();
  request = page.locator(".change-request").first();
  await request
    .getByLabel("Decision reason")
    .fill("SYN dispatcher accepts after current booking guard review.");
  await request.getByRole("button", { name: "Accept and check move" }).focus();
  await page.keyboard.press("Enter");
  await expect(request.getByText("Accepted", { exact: true })).toBeVisible();
  await capture(page, info, "project-accepted-held");
  await page.goto("/service/appointments/" + id("a8", 1));
  await identity(page, "assigned-technician");
  await expect(
    page.getByRole("button", { name: "Move or reassign", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Propose change", exact: true })
    .click();
  await expect(page.getByLabel("Request source")).toHaveValue(
    "TechnicianRequest",
  );
  await capture(page, info, "technician-request-boundary");
});
