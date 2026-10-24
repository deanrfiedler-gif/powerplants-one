import assert from "node:assert/strict";
import { matchesConfirmedContact } from "../../src/scheduling/booking-rules";
import { test } from "node:test";
import {
  siteChecks,
  siteReadinessOutcome,
} from "../../src/scheduling/site-readiness-model";
import {
  preparationDeadline,
  type PreparationCalendar,
} from "../../src/scheduling/preparation-deadline";

const checks = () =>
  siteChecks(
    Object.fromEntries(
      ["access", "power_water", "equipment", "isolation"].map((key) => [
        key,
        { status: "Confirmed" },
      ]),
    ),
  );
test("site evidence requires exactly four typed checks and bounded notes", () => {
  assert.equal(checks().access.note, "");
  assert.throws(() => siteChecks({ access: { status: "Confirmed" } }));
  assert.throws(() => siteChecks({ ...checks(), extra: {} }));
  assert.throws(() => siteChecks({ ...checks(), access: { status: "Pass" } }));
  assert.throws(() =>
    siteChecks({
      ...checks(),
      access: { status: "Confirmed", note: "x".repeat(1001) },
    }),
  );
});
test("early evidence stays unknown; exact opening counts; NotReady blocks even a confirmed contact", () => {
  const opens = new Date("2026-10-24T00:00:00Z");
  const c = { outcome: "Confirmed", occurred_at: opens, checks: checks() };
  assert.equal(siteReadinessOutcome(null, opens), "Unknown");
  assert.equal(
    siteReadinessOutcome(
      { ...c, occurred_at: new Date(opens.getTime() - 1) },
      opens,
    ),
    "Unknown",
  );
  assert.equal(siteReadinessOutcome(c, opens), "Pass");
  c.checks.access.status = "NotApplicable";
  assert.equal(siteReadinessOutcome(c, opens), "Pass");
  assert.equal(
    siteReadinessOutcome({ ...c, outcome: "NoResponse" }, opens),
    "Unknown",
  );
  c.checks.isolation.status = "NotReady";
  assert.equal(siteReadinessOutcome(c, opens), "Blocked");
});
const calendar = (zone = "Australia/Brisbane"): PreparationCalendar => ({
  timezone: zone,
  effective_from: "2026-01-01T00:00:00Z",
  effective_to: "2027-01-01T00:00:00Z",
  intervals: [1, 2, 3, 4, 5].map((weekday) => ({
    weekday,
    start_minute: 480,
    end_minute: 1020,
  })),
  exceptions: [],
});
test("noon deadline uses the previous published working day and skips full closures", () => {
  const c = calendar();
  assert.equal(
    preparationDeadline("2026-10-25T23:00:00Z", c.timezone, 720, c),
    "2026-10-23T02:00:00.000Z",
  );
  c.exceptions.push({
    start_at: "2026-10-22T14:00:00Z",
    end_at: "2026-10-23T14:00:00Z",
  });
  assert.equal(
    preparationDeadline("2026-10-25T23:00:00Z", c.timezone, 720, c),
    "2026-10-22T02:00:00.000Z",
  );
  c.intervals = [];
  assert.equal(
    preparationDeadline("2026-10-25T23:00:00Z", c.timezone, 720, c),
    null,
  );
});
test("DST, partial closure and different site/calendar zones preserve civil noon", () => {
  const c = calendar("Australia/Sydney");
  c.exceptions.push({
    start_at: "2026-10-08T21:00:00Z",
    end_at: "2026-10-08T23:00:00Z",
  });
  assert.equal(
    preparationDeadline("2026-10-11T22:00:00Z", "Australia/Sydney", 720, c),
    "2026-10-09T01:00:00.000Z",
  );
  assert.equal(
    preparationDeadline("2026-10-11T23:00:00Z", "Australia/Brisbane", 720, c),
    "2026-10-09T02:00:00.000Z",
  );
  c.effective_from = "2026-10-11T00:00:00Z";
  assert.equal(
    preparationDeadline("2026-10-11T22:00:00Z", "Australia/Sydney", 720, c),
    null,
  );
});

test("site confirmation never supplies date agreement; original contact shape remains compatible", () => {
  const start = new Date("2026-10-26T00:00:00Z"),
    end = new Date("2026-10-26T02:00:00Z"),
    recipient = "synthetic-contact";
  const original = {
    outcome: "Confirmed",
    start_at: start,
    end_at: end,
    recipient_id: recipient,
  };
  assert.equal(
    matchesConfirmedContact(original, start, end, recipient, "Confirmed"),
    true,
  );
  assert.equal(
    matchesConfirmedContact(
      { ...original, purpose: "DateAgreement" },
      start,
      end,
      recipient,
      "Confirmed",
    ),
    true,
  );
  assert.equal(
    matchesConfirmedContact(
      { ...original, purpose: "SiteReadiness" },
      start,
      end,
      recipient,
      "Confirmed",
    ),
    false,
  );
  const late = {
    outcome: "Confirmed",
    occurred_at: new Date("2026-10-25T12:00:00Z"),
    checks: checks(),
  };
  assert.equal(
    siteReadinessOutcome(late, new Date("2026-10-21T00:00:00Z")),
    "Pass",
  );
});
