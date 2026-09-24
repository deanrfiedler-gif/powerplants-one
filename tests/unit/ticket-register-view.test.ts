import assert from "node:assert/strict";
import test from "node:test";
import {
  actionDue,
  actionOwner,
  attention,
  cardChips,
  channelLabel,
  clarificationOverdue,
  customerLabel,
  equipmentLabel,
  formatWhen,
  initials,
  moveTargets,
  moveUnavailable,
  nativeLanes,
  nextAction,
  queueMembership,
  relativeTime,
  siteLabel,
  stageLabel,
  workOrderLabel,
  type RegisterItem,
} from "../../src/service/ticket-register-view";

const now = new Date("2026-09-15T00:00:00Z"); // 10:00 am Tuesday 15 September 2026, Melbourne

const item = (over: Partial<RegisterItem> = {}): RegisterItem => ({
  id: "40000000-0000-4000-8000-000000000201",
  display_number: "SYN-PPO-TKT-000201",
  summary: "Irrigation pump stops between watering runs",
  status: "New",
  priority: "Urgent",
  version: 1,
  received_at: "2026-09-14T23:20:00Z",
  channel: "Phone",
  next_action: "Review intake and assign response",
  triage_owner_name: "Alex Morgan",
  site: { id: "s", display_number: "SYN-PPO-SITE-000001", display_name: "Nursery & propagation" },
  site_identification_needed: false,
  asset: { id: "a", display_number: "SYN-PPO-AST-000501", description: "Irrigation pump 01" },
  customer: { id: "o", display_name: "Willowbank Horticulture", basis: "SiteOperator" },
  clarification: null,
  clarification_unavailable: false,
  triage_blocker_count: 0,
  work_orders: [],
  can_edit_intake: true,
  ...over,
});

const clarification = (due_at: string | null, status = "Open") => ({
  id: "c",
  summary: "Obtain sensor label, reading examples and exact growing area",
  owner_name: "Riley Chen",
  due_at,
  due_needed: due_at === null,
  status,
});

test("recorded times read against now without inventing a service level", () => {
  assert.deepEqual(relativeTime(now, "2026-09-15T00:30:00Z"), { text: "in 30 min", overdue: false });
  assert.deepEqual(relativeTime(now, "2026-09-15T02:00:00Z"), { text: "in 2 h", overdue: false });
  assert.deepEqual(relativeTime(now, "2026-09-15T01:30:00Z"), { text: "in 1 h 30 min", overdue: false });
  assert.deepEqual(relativeTime(now, "2026-09-14T23:00:00Z"), { text: "1 h overdue", overdue: true });
  assert.deepEqual(relativeTime(now, "2026-09-14T23:30:00Z"), { text: "30 min overdue", overdue: true });
  assert.deepEqual(relativeTime(now, "2026-09-12T00:00:00Z"), { text: "3 d overdue", overdue: true });
  assert.deepEqual(relativeTime(now, "2026-09-15T00:00:20Z"), { text: "due now", overdue: false });
});

test("the native board has exactly the three reachable states, in order", () => {
  assert.deepEqual(
    nativeLanes.map((l) => l.status),
    ["New", "NeedsInformation", "Triaged"],
  );
  assert.equal(stageLabel("NeedsInformation"), "Needs information");
  assert.equal(stageLabel("Unknown"), "Unknown");
});

test("queue membership matches the server's queue definitions", () => {
  assert.deepEqual(queueMembership(item(), now), ["all_open", "new", "urgent"]);
  const overdue = item({ status: "NeedsInformation", priority: "Normal", clarification: clarification("2026-09-14T23:00:00Z") });
  assert.deepEqual(queueMembership(overdue, now), ["all_open", "needs_information", "overdue_clarifications"]);
  assert.deepEqual(queueMembership(item({ status: "Triaged", priority: "High" }), now), ["all_open", "triaged"]);
  assert.deepEqual(queueMembership(item({ status: "Closed" }), now), []);
});

test("an overdue clarification needs an open activity with a past due time", () => {
  assert.equal(clarificationOverdue(item({ status: "NeedsInformation", clarification: clarification("2026-09-14T23:00:00Z", "Completed") }), now), false);
  assert.equal(clarificationOverdue(item({ status: "NeedsInformation", clarification: clarification(null) }), now), false);
  assert.equal(clarificationOverdue(item({ status: "New", clarification: clarification("2026-09-14T23:00:00Z") }), now), false);
});

test("each row shows at most one attention chip, most urgent first", () => {
  assert.deepEqual(attention(item(), now), { text: "Ready to triage", tone: "neutral" });
  assert.deepEqual(attention(item({ triage_blocker_count: 1 }), now), { text: "1 triage blocker", tone: "warning" });
  assert.deepEqual(attention(item({ status: "NeedsInformation", triage_blocker_count: 2 }), now), { text: "2 triage blockers", tone: "warning" });
  assert.deepEqual(
    attention(item({ status: "NeedsInformation", triage_blocker_count: 2, clarification: clarification("2026-09-14T23:00:00Z") }), now),
    { text: "Clarification 1 h overdue", tone: "danger" },
  );
  assert.equal(attention(item({ status: "Triaged", triage_blocker_count: null }), now), null);
  assert.deepEqual(
    attention(item({ status: "Triaged", triage_blocker_count: null, clarification_unavailable: true }), now),
    { text: "Clarification not visible to you", tone: "neutral" },
  );
});

test("the next-action block prefers an open clarification and never invents a due time", () => {
  assert.deepEqual(nextAction(item(), now), {
    heading: "Next action",
    text: "Review intake and assign response",
    owner: "Alex Morgan",
    due: null,
    dueNeeded: false,
  });
  const c = nextAction(item({ status: "NeedsInformation", clarification: clarification("2026-09-14T23:00:00Z") }), now);
  assert.equal(c.heading, "Owned clarification");
  assert.equal(c.owner, "Riley Chen");
  assert.deepEqual(c.due, { text: "1 h overdue", overdue: true });
  assert.equal(nextAction(item({ next_action: null }), now).text, "Not recorded");
});

test("unknown values are stated in words", () => {
  assert.equal(customerLabel(item({ customer: null })), "Customer not identified");
  assert.equal(siteLabel(item({ site: null, site_identification_needed: true })), "Site not identified");
  assert.equal(equipmentLabel(item({ asset: null })), "Not recorded");
  assert.equal(workOrderLabel({ id: "w", display_number: "SYN-PPO-WO-000503", status: "Authorised" }), "WO-000503 · authorised");
});

test("I2 board moves offer only the native transitions, and say why Move is unavailable", () => {
  assert.deepEqual(moveTargets({ status: "New" }), ["NeedsInformation", "Triaged"]);
  assert.deepEqual(moveTargets({ status: "NeedsInformation" }), ["Triaged"]);
  assert.deepEqual(moveTargets({ status: "Triaged" }), []);
  assert.deepEqual(moveTargets({ status: "Active" }), []);
  assert.equal(moveUnavailable(item()), null);
  assert.match(moveUnavailable(item({ can_edit_intake: false }))!, /edit permission/);
  assert.match(moveUnavailable(item({ status: "Triaged", can_edit_intake: false }))!, /last stage/);
});

test("I2 times read in the business time zone against the read's as-at time", () => {
  assert.equal(formatWhen("2026-09-14T23:20:00Z", now), "today 9:20 am");
  assert.equal(formatWhen("2026-09-14T04:00:00Z", now), "yesterday 2:00 pm");
  assert.equal(formatWhen("2026-09-11T01:00:00Z", now), "Fri 11 Sept, 11:00 am");
  assert.equal(channelLabel("Phone"), "phone");
  assert.equal(channelLabel("PlannedMaintenance"), "planned maintenance");
  assert.equal(initials("Alex Morgan"), "AM");
  assert.equal(initials("Riley"), "R");
  assert.equal(initials(""), "?");
});

test("I2 action owner and due come from the owned clarification, otherwise the triage owner with no due time", () => {
  const open = item({
    status: "NeedsInformation",
    clarification: { id: "c", summary: "Obtain sensor label", owner_name: "Riley Chen", due_at: "2026-09-14T23:00:00Z", due_needed: false, status: "Open" },
  });
  assert.equal(actionOwner(open), "Riley Chen");
  assert.deepEqual(actionDue(open, now), { text: "today 9:00 am", detail: "1 h overdue", tone: "danger" });
  const needed = item({
    status: "NeedsInformation",
    clarification: { id: "c", summary: "Obtain sensor label", owner_name: "Riley Chen", due_at: null, due_needed: true, status: "InProgress" },
  });
  assert.deepEqual(actionDue(needed, now), { text: "Due time needed", detail: null, tone: "warning" });
  assert.equal(actionOwner(item()), "Alex Morgan");
  assert.deepEqual(actionDue(item(), now), { text: "No due time", detail: null, tone: "neutral" });
  const done = item({
    status: "Triaged",
    clarification: { id: "c", summary: "Obtain sensor label", owner_name: "Riley Chen", due_at: "2026-09-14T23:00:00Z", due_needed: false, status: "Completed" },
  });
  assert.equal(actionOwner(done), "Alex Morgan");
  assert.equal(actionDue(done, now).text, "No due time");
});

test("I2 card chips never repeat the overdue clarification the next-action block shows", () => {
  const overdue = item({
    status: "NeedsInformation",
    triage_blocker_count: 2,
    clarification: { id: "c", summary: "Obtain sensor label", owner_name: "Riley Chen", due_at: "2026-09-14T23:00:00Z", due_needed: false, status: "Open" },
  });
  assert.deepEqual(cardChips(overdue), [{ text: "2 triage blockers", tone: "warning" }]);
  assert.deepEqual(cardChips(item()), [{ text: "Ready to triage", tone: "neutral" }]);
  assert.deepEqual(cardChips(item({ status: "Triaged", triage_blocker_count: null, clarification_unavailable: true })), [
    { text: "Clarification not visible to you", tone: "neutral" },
  ]);
});
