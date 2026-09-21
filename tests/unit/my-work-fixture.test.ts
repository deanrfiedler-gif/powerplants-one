import assert from "node:assert/strict";
import { test } from "node:test";
import { todaySlots } from "../helpers/my-work";
import { browserScenarioNow } from "../helpers/my-work-clock";
import { attentionGroup, localDay, durationMinutes } from "../../src/activities/work-view";

test("the real-clock My Work fixture retains four ordered future anchors through late evening", () => {
  for (const time of ["00:01", "08:40", "21:31", "22:30", "22:55"]) {
    const now = new Date(`2026-09-21T${time}:00+10:00`),
      slots = todaySlots(now),
      anchors = [slots.deadline, slots.call.starts_at, slots.meeting.starts_at, slots.visit.starts_at];
    assert.equal(slots.day, "2026-09-21");
    assert.ok(Date.parse(anchors[0]) - now.getTime() >= 20 * 60000);
    for (const [i, at] of anchors.entries()) {
      assert.equal(localDay(at), slots.day);
      if (i) assert.ok(Date.parse(at) - Date.parse(anchors[i - 1]) >= 5 * 60000);
    }
    const appointments = [slots.call, slots.meeting, slots.visit];
    assert.deepEqual(appointments.map(durationMinutes), [20, 45, 60]);
    for (const [i, appointment] of appointments.entries()) {
      assert.equal(attentionGroup({ id: String(i), status: "Open", due_needed: false, due_date_only: false, ...appointment }, now.toISOString()), "Today");
    }
    assert.equal(localDay(slots.twoDaysAgo), "2026-09-19");
    assert.equal(localDay(slots.yesterday), "2026-09-20");
    assert.equal(localDay(slots.tomorrow), "2026-09-22");
  }
});

test("an overnight appointment keeps its duration and today's start; near-midnight refusal stays explicit", () => {
  const slots = todaySlots(new Date("2026-09-21T22:55:00+10:00"));
  assert.equal(localDay(slots.visit.starts_at), "2026-09-21");
  assert.equal(localDay(slots.visit.due_at), "2026-09-22");
  assert.equal(durationMinutes(slots.visit), 60);
  assert.throws(() => todaySlots(new Date("2026-09-21T22:56:00+10:00")), /Too little of the Brisbane day/);
  assert.doesNotThrow(() => todaySlots(new Date("2026-09-22T00:00:01+10:00")));
});

test("every admitted late-evening scenario keeps the journey's thirty-minute reschedule in Today", () => {
  for (let minute = 0; minute < 120; minute++) {
    const now = new Date(Date.parse("2026-09-21T22:00:00+10:00") + minute * 60000);
    let slots: ReturnType<typeof todaySlots>;
    try {
      slots = todaySlots(now);
    } catch (error) {
      assert.match(String(error), /Too little of the Brisbane day/);
      continue;
    }
    const moved = new Date(Date.parse(slots.meeting.starts_at) + 30 * 60000).toISOString();
    assert.equal(localDay(moved), slots.day, `reschedule leaves Today for fixture at ${now.toISOString()}`);
    assert.equal(attentionGroup({ id: "moved", status: "Open", due_needed: false, due_date_only: false, starts_at: moved, due_at: new Date(Date.parse(moved) + 45 * 60000).toISOString() }, now.toISOString()), "Today");
  }
});

test("browser scenario preserves the full day and includes real creation timestamps across midnight", () => {
  for (const at of ["2026-09-21T23:21:00+10:00", "2026-09-21T23:36:43+10:00", "2026-09-21T23:59:59+10:00", "2026-09-22T00:00:01+10:00"]) {
    const wallClock = new Date(at), now = new Date(browserScenarioNow(wallClock)), slots = todaySlots(now);
    assert.ok(now.getTime() - wallClock.getTime() > 24 * 3600000, "snapshot must include records created during the whole journey");
    const anchors = [slots.deadline, slots.call.starts_at, slots.meeting.starts_at, slots.visit.starts_at];
    assert.equal(new Set(anchors).size, 4);
    for (const anchor of anchors) {
      assert.equal(localDay(anchor), slots.day);
      assert.ok(Date.parse(anchor) - now.getTime() >= 20 * 60000);
    }
    assert.deepEqual([slots.call, slots.meeting, slots.visit].map(durationMinutes), [20, 45, 60]);
  }
});
