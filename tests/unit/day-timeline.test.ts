import assert from "node:assert/strict";
import { test } from "node:test";
import {
  axisPercent,
  dayMinute,
  hoursText,
  initials,
  isoWeek,
  kindText,
  laneDay,
  subtractSpans,
  minuteAtFraction,
  visitState,
} from "../../src/scheduling/day-timeline";

const zone = "Australia/Brisbane";
const day = "2031-09-22"; // Monday
const weekdays = (start: number, end: number) => ({
  timezone: zone,
  intervals: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_minute: start, end_minute: end })),
});
// Brisbane local time on the test day as an ISO instant (UTC+10, no daylight saving).
const at = (hhmm: string, d = day) => new Date(Date.parse(`${d}T${hhmm}:00+10:00`)).toISOString();
const lane = (over: Partial<Parameters<typeof laneDay>[0]> = {}) =>
  laneDay({ calendar: weekdays(420, 1080), blocks: [], exceptions: [], busy: [], day, zone, ...over });

test("minutes are measured from the displayed day's midnight, across midnight too", () => {
  assert.equal(dayMinute(at("07:30"), zone, day), 450);
  assert.equal(dayMinute(at("00:30", "2031-09-23"), zone, day), 1470);
  assert.equal(dayMinute(at("10:00"), "UTC", "2031-09-22"), 0);
});

test("the axis runs 07:00 to 18:00 and drops snap to 15 minutes", () => {
  assert.equal(axisPercent(420), 0);
  assert.equal(axisPercent(1080), 100);
  assert.equal(axisPercent(300), 0);
  assert.equal(minuteAtFraction(0.5), 750);
  assert.equal(minuteAtFraction(0.0123), 435);
});

test("07:00 to 18:00 calendars show extended-hours bands; 08:00 to 17:00 calendars show not working", () => {
  assert.deepEqual(lane().bands, [
    { kind: "Extended", span: [420, 480] },
    { kind: "Extended", span: [1020, 1080] },
  ]);
  assert.deepEqual(lane({ calendar: weekdays(480, 1020) }).bands, [
    { kind: "NotWorking", span: [420, 480] },
    { kind: "NotWorking", span: [1020, 1080] },
  ]);
  assert.deepEqual(lane({ day: "2031-09-27" }).bands, [{ kind: "NotWorking", span: [420, 1080] }]);
});

test("hours booked and free time count standard hours only, travel included, gaps under 30 minutes ignored", () => {
  const l = lane({
    busy: [
      { start_at: at("07:30"), end_at: at("12:30") }, // visit 10:00-12:00 with travel; 07:30-08:00 is extended
      { start_at: at("12:50"), end_at: at("15:30") },
    ],
  });
  assert.equal(l.capacityMinutes, 540);
  assert.equal(l.bookedMinutes, 270 + 160);
  assert.equal(l.free, "Free from 15:30");
  assert.equal(hoursText(l.bookedMinutes), "7.2");
  assert.equal(hoursText(l.capacityMinutes), "9");
});

test("unavailable time and closures reduce capacity; a whole-day block means away", () => {
  const blocked = lane({ blocks: [{ kind: "Unavailable", start_at: at("13:00"), end_at: at("15:00") }] });
  assert.equal(blocked.capacityMinutes, 420);
  assert.equal(blocked.free, "Free 08:00–13:00 · from 15:00");
  assert.deepEqual(blocked.unavailable, [{ span: [780, 900], label: "Unavailable", time: "13:00–15:00" }]);
  const leave = lane({ blocks: [{ kind: "Leave", start_at: at("00:00"), end_at: at("00:00", "2031-09-27") }] });
  assert.equal(leave.away, true);
  assert.equal(leave.free, "");
  assert.equal(leave.unavailable[0].time, "All day");
  const closed = lane({ exceptions: [{ start_at: at("00:00"), end_at: at("00:00", "2031-09-23") }] });
  assert.equal(closed.capacityMinutes, 0);
  assert.equal(closed.away, true);
});

test("today's free time starts from now", () => {
  assert.equal(lane({ now: at("09:40") }).free, "Free for the rest of the day");
  assert.equal(
    lane({ now: at("09:40"), busy: [{ start_at: at("11:00"), end_at: at("12:00") }] }).free,
    "Free 09:45–11:00 · from 12:00",
  );
  assert.equal(lane({ now: at("17:30") }).free, "No free time left today");
  assert.equal(lane({ now: at("09:40", "2031-09-21") }).free, "Free all day");
});

test("what needs attention follows Dean's decision, with live holds first", () => {
  const ok = { status: "Confirmed", customer_commitment: "Confirmed", pack_requirement: "Acknowledged", scope_review_required: false };
  assert.equal(visitState(ok).kind, "ok");
  assert.equal(visitState({ ...ok, pack_requirement: "AwaitingAcknowledgement" }).kind, "ok");
  assert.equal(visitState({ ...ok, pack_requirement: "PreparationRequired" }).short, "Pack needed");
  assert.equal(visitState({ ...ok, pack_requirement: "ReviewRequired" }).short, "Pack review");
  assert.equal(visitState({ ...ok, customer_commitment: "Changed" }).short, "Contact due");
  assert.equal(visitState({ ...ok, scope_review_required: true, pack_requirement: "PreparationRequired" }).short, "Scope review");
  assert.equal(visitState({ ...ok, policy_impacts: [{ held: true }] }).short, "Policy hold");
  assert.equal(visitState({ ...ok, status: "Proposed" }).kind, "proposed");
});

test("initials come from the person's own name", () => {
  assert.equal(initials("SYN Alex Lead"), "AL");
  assert.equal(initials("SYN Casey — expired skill"), "CA");
  assert.equal(initials("SYN Other site technician"), "OS");
  assert.equal(initials("Example Technician"), "ET");
});

test("ISO week numbers and span subtraction for the Week view", () => {
  assert.equal(isoWeek("2031-09-22"), 39);
  assert.equal(kindText("OtherWork"), "Other work");
  assert.equal(kindText("Leave"), "Leave");
  assert.equal(isoWeek("2026-01-01"), 1);
  assert.equal(isoWeek("2027-01-01"), 53);
  assert.equal(isoWeek("2024-12-30"), 1);
  assert.deepEqual(subtractSpans([[420, 750]], [[450, 750]]), [[420, 450]]);
  assert.deepEqual(subtractSpans([[420, 750]], [[420, 750]]), []);
});
