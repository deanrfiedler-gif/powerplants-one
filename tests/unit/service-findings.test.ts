import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findingKey,
  findingQuery,
  followUpState,
  inView,
  isOverdue,
  type Finding,
} from "../../src/service/findings/model";

test("Findings query accepts only bounded filters and exact source identities", () => {
  assert.equal(findingQuery({}).view, "open");
  assert.equal(
    findingQuery({ q: "  Pump  ", limit: "50", offset: "2" }).q,
    "pump",
  );
  for (const value of [
    { limit: 51 },
    { limit: 0 },
    { offset: -1 },
    { offset: "1e2" },
    { source: "sql" },
    { view: "ready_to_close" },
    { q: "\u0000" },
    { q: "x".repeat(201) },
    { owner_id: "bad" },
    { sort: "other" },
  ])
    assert.throws(() => findingQuery(value));
  const id = "90000000-0000-4000-8000-000000000001";
  assert.deepEqual(findingKey(`inspection:${id}`), {
    source: "inspection",
    id,
  });
  for (const key of [
    id,
    `unknown:${id}`,
    `schedule:${id}:more`,
    `schedule:bad`,
  ])
    assert.throws(() => findingKey(key));
});

test("Follow-up completion and cancellation do not assert source closure", () => {
  assert.equal(followUpState("Completed"), "FollowUpCompleted");
  assert.equal(followUpState("Cancelled"), "NeedsOwner");
  assert.equal(followUpState(undefined), "NeedsOwner");
  assert.equal(followUpState("InProgress"), "Open");
  const row = {
    state: "FollowUpCompleted",
    action: { status: "Completed" },
    overdue: false,
  } as Finding;
  assert.ok(inView(row, "open"));
  assert.ok(inView(row, "follow_up_completed"));
  assert.ok(!inView(row, "closed"));
  assert.ok(!inView({ ...row, state: "Superseded" }, "open"));
});

test("Overdue compares the retained deadline instant and never active-looking closed work", () => {
  const row = {
    state: "Open",
    action: { status: "Open", due_at: "2026-10-20T13:59:59.999Z" },
  } as Finding;
  assert.equal(isOverdue(row, new Date("2026-10-20T13:59:59.999Z")), false);
  assert.equal(isOverdue(row, new Date("2026-10-21T00:00:00+10:00")), true);
  for (const state of ["Closed", "Superseded"] as const)
    assert.equal(
      isOverdue({ ...row, state }, new Date("2026-10-21T00:00:00Z")),
      false,
    );
  assert.equal(
    isOverdue(
      { ...row, action: { ...row.action!, status: "Cancelled" } },
      new Date("2026-10-21T00:00:00Z"),
    ),
    false,
  );
});
