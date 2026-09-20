import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attentionGroup,
  compareDue,
  durationLabel,
  durationMinutes,
  endOfLocalDay,
  firstName,
  greeting,
  localDayBounds,
  longDate,
  nextScheduleId,
  shortDate,
  timing,
  type Timed,
} from "../../src/activities/work-view";

// Report r03's scenario: Monday 21 September 2026, 8:40 am in Australia/Brisbane.
const NOW = "2026-09-20T22:40:00.000Z";
const brisbane = (local: string) =>
  new Date(local + ":00+10:00").toISOString();
const row = (id: string, fields: Partial<Timed>): Timed => ({
  id,
  status: "Open",
  due_at: null,
  due_needed: false,
  due_date_only: false,
  starts_at: null,
  ...fields,
});
const proposal = row("a1", { due_at: brisbane("2026-09-19T17:00") }),
  quotation = row("a2", { due_at: endOfLocalDay("2026-09-20"), due_date_only: true }),
  firstContact = row("a3", { due_at: brisbane("2026-09-21T09:00") }),
  call = row("a4", {
    starts_at: brisbane("2026-09-21T09:30"),
    due_at: brisbane("2026-09-21T09:50"),
  }),
  scope = row("a5", {
    starts_at: brisbane("2026-09-21T11:00"),
    due_at: brisbane("2026-09-21T11:45"),
  }),
  visit = row("a6", {
    starts_at: brisbane("2026-09-21T15:00"),
    due_at: brisbane("2026-09-21T16:00"),
  }),
  undated = row("a7", { due_needed: true });

test("two overdue plus four today make six; an undated activity belongs to neither", () => {
  const groups = [proposal, quotation, firstContact, call, scope, visit, undated].map(
    (a) => attentionGroup(a, NOW),
  );
  assert.deepEqual(groups, [
    "Overdue",
    "Overdue",
    "Today",
    "Today",
    "Today",
    "Today",
    "DateNeeded",
  ]);
  assert.equal(
    attentionGroup(row("done", { status: "Completed", due_at: proposal.due_at }), NOW),
    "Closed",
  );
  assert.equal(
    attentionGroup(row("later", { due_at: brisbane("2026-09-22T09:00") }), NOW),
    "Upcoming",
  );
});

test("timing distinguishes overdue text, Due by and Starts at, and never invents a time", () => {
  assert.deepEqual(timing(proposal, NOW), {
    tone: "overdue",
    caption: null,
    value: "2 days overdue",
  });
  assert.deepEqual(timing(quotation, NOW), {
    tone: "overdue",
    caption: null,
    value: "1 day overdue",
  });
  assert.deepEqual(timing(firstContact, NOW), {
    tone: "normal",
    caption: "Due by",
    value: "9:00 am",
  });
  assert.deepEqual(timing(call, NOW), {
    tone: "normal",
    caption: "Starts at",
    value: "9:30 am",
  });
  assert.deepEqual(timing(visit, NOW), {
    tone: "normal",
    caption: "Starts at",
    value: "3:00 pm",
  });
  const dateOnlyToday = row("d", {
    due_at: endOfLocalDay("2026-09-21"),
    due_date_only: true,
  });
  assert.deepEqual(timing(dateOnlyToday, NOW), {
    tone: "normal",
    caption: "Due",
    value: "Today",
  });
  assert.equal(timing(undated, NOW).value, "Date needed");
});

test("crossing a due time: a meeting is not overdue because it started, only after its planned end", () => {
  const during = brisbane("2026-09-21T09:40"),
    after = brisbane("2026-09-21T09:51");
  assert.equal(attentionGroup(call, during), "Today");
  assert.equal(timing(call, during).caption, "Started");
  assert.equal(attentionGroup(call, after), "Overdue");
  assert.deepEqual(timing(call, after), {
    tone: "overdue",
    caption: "Overdue · ended",
    value: "9:50 am",
  });
  // A timed deadline is overdue the moment it passes; a date-only task only after its local day ends.
  assert.equal(attentionGroup(firstContact, brisbane("2026-09-21T09:01")), "Overdue");
  const dateOnly = row("d", { due_at: endOfLocalDay("2026-09-21"), due_date_only: true });
  assert.equal(attentionGroup(dateOnly, brisbane("2026-09-21T23:59")), "Today");
  assert.equal(attentionGroup(dateOnly, brisbane("2026-09-22T00:00")), "Overdue");
  assert.equal(timing(dateOnly, brisbane("2026-09-22T00:00")).value, "1 day overdue");
});

test("due-time order is stable for equal times and the next entry skips ended appointments", () => {
  const twin = row("a0", { due_at: firstContact.due_at });
  assert.deepEqual(
    [visit, firstContact, scope, twin, call, undated].toSorted(compareDue).map((a) => a.id),
    ["a0", "a3", "a4", "a5", "a6", "a7"],
  );
  assert.equal(nextScheduleId([visit, scope, call], NOW), "a4");
  assert.equal(nextScheduleId([visit, scope, call], brisbane("2026-09-21T09:40")), "a4");
  assert.equal(nextScheduleId([visit, scope, call], brisbane("2026-09-21T10:00")), "a5");
  assert.equal(nextScheduleId([visit, scope, call], brisbane("2026-09-21T16:30")), null);
  assert.equal(
    nextScheduleId([{ ...call, status: "Completed" }, scope], NOW),
    "a5",
  );
});

test("durations, greeting and civil-day helpers use the documented time zone", () => {
  assert.equal(durationMinutes(call), 20);
  assert.equal(durationLabel(20), "20 min");
  assert.equal(durationLabel(60), "60 min");
  assert.equal(durationLabel(120), "2 h");
  assert.equal(durationLabel(155), "2 h 35 min");
  assert.equal(durationMinutes(firstContact), null);
  assert.equal(greeting(NOW), "Good morning");
  assert.equal(greeting(brisbane("2026-09-21T12:00")), "Good afternoon");
  assert.equal(greeting(brisbane("2026-09-21T18:30")), "Good evening");
  assert.equal(longDate(NOW), "Monday, 21 September 2026");
  assert.equal(shortDate("2026-09-21T13:59:59.999Z"), "21 Sep");
  assert.equal(shortDate("2026-09-21T14:00:00.000Z"), "22 Sep");
  assert.equal(firstName("SYN Coordinator"), "Coordinator");
  assert.equal(firstName("Dean Fiedler"), "Dean");
  assert.equal(endOfLocalDay("2026-09-21"), "2026-09-21T13:59:59.999Z");
  assert.deepEqual(localDayBounds("2026-09-21"), {
    start: "2026-09-20T14:00:00.000Z",
    end: "2026-09-21T14:00:00.000Z",
  });
});
