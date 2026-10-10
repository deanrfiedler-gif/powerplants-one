import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extendedHours,
  extendedHoursNotice,
} from "../../src/scheduling/working-hours";

const brisbane = (before: number, after: number) => ({
  timezone: "Australia/Brisbane",
  travel_before_minutes: before,
  travel_after_minutes: after,
});
// 10:00 to 12:00 Brisbane (UTC+10, no daylight saving).
const visit = ["2031-09-22T00:00:00Z", "2031-09-22T02:00:00Z"] as const;

test("standard hours 08:00 to 17:00 include their boundaries", () => {
  assert.equal(extendedHours(...visit, brisbane(0, 0)), null);
  assert.equal(extendedHours(...visit, brisbane(120, 300)), null);
});

test("travel that starts before 08:00 or ends after 17:00 is extended hours", () => {
  assert.deepEqual(extendedHours(...visit, brisbane(121, 0)), {
    from: "07:59",
    to: "12:00",
  });
  assert.deepEqual(extendedHours(...visit, brisbane(0, 301)), {
    from: "10:00",
    to: "17:01",
  });
  assert.deepEqual(extendedHours(...visit, brisbane(180, 360)), {
    from: "07:00",
    to: "18:00",
  });
});

test("a visit itself outside standard hours is extended hours without travel", () => {
  assert.deepEqual(
    extendedHours("2031-09-22T07:00:00Z", "2031-09-22T08:00:00Z", brisbane(0, 0)),
    { from: "17:00", to: "18:00" },
  );
});

test("a reservation that crosses midnight is never inside standard hours", () => {
  assert.deepEqual(
    extendedHours("2031-09-22T12:00:00Z", "2031-09-22T14:30:00Z", brisbane(0, 0)),
    { from: "22:00", to: "00:30" },
  );
});

test("hours are read in the person's calendar timezone, including daylight saving", () => {
  // 08:00 Brisbane is 09:00 in Melbourne during daylight saving.
  const melbourne = {
    timezone: "Australia/Melbourne",
    travel_before_minutes: 60,
    travel_after_minutes: 0,
  };
  assert.equal(
    extendedHours("2031-10-20T23:00:00Z", "2031-10-21T01:00:00Z", melbourne),
    null,
  );
  assert.deepEqual(
    extendedHours("2031-10-20T21:30:00Z", "2031-10-20T23:00:00Z", melbourne),
    { from: "07:30", to: "10:00" },
  );
});

test("the notice names the person, the times and the standard hours", () => {
  assert.equal(
    extendedHoursNotice("SYN Alex Lead", { from: "07:30", to: "12:30" }, true),
    "SYN Alex Lead: 07:30 to 12:30 including travel, outside the 08:00 to 17:00 standard hours.",
  );
  assert.equal(
    extendedHoursNotice("SYN Alex Lead", { from: "17:00", to: "18:00" }, false),
    "SYN Alex Lead: 17:00 to 18:00, outside the 08:00 to 17:00 standard hours.",
  );
});
