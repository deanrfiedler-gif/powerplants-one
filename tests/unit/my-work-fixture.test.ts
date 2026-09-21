import assert from "node:assert/strict";
import { test } from "node:test";
import { todaySlots } from "../helpers/my-work";
import { attentionGroup, localDay, durationMinutes } from "../../src/activities/work-view";

test("the real-clock My Work fixture retains four ordered future anchors through late evening", () => {
  for (const time of ["00:01", "08:40", "21:31", "22:30", "23:15"]) {
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
  const slots = todaySlots(new Date("2026-09-21T23:15:00+10:00"));
  assert.equal(localDay(slots.visit.starts_at), "2026-09-21");
  assert.equal(localDay(slots.visit.due_at), "2026-09-22");
  assert.equal(durationMinutes(slots.visit), 60);
  assert.throws(() => todaySlots(new Date("2026-09-21T23:21:00+10:00")), /Too little of the Brisbane day/);
  assert.doesNotThrow(() => todaySlots(new Date("2026-09-22T00:00:01+10:00")));
});
