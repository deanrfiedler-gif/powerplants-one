import assert from "node:assert/strict";
import { test } from "node:test";
import { leadRecordSummary } from "../../src/crm/leads/record";

test("record age uses completed 24-hour periods without timezone or terminal-state rounding", () => {
  const lead = {
    version: 4,
    created_at: "2030-10-12T13:59:59.999Z",
    updated_at: "2030-10-12T13:59:59.999Z",
    actions: [],
    next_action_state: "Needed",
  };
  const start = Date.parse(lead.created_at);
  for (const [offset, days] of [
    [-1, 0],
    [0, 0],
    [86_399_999, 0],
    [86_400_000, 1],
    [172_800_000, 2],
  ]) {
    const result = leadRecordSummary(lead, start + offset);
    assert.equal(result.age_days, days);
    assert.equal(result.observed_at, new Date(start + offset).toISOString());
    assert.equal(result.last_activity, null);
  }
});
test("last activity uses changed time with stable ID ties and preserves the source array", () => {
  const actions = [
    {
      id: "b",
      version: 1,
      summary: "SYN Tie B",
      status: "Open",
      updated_at: "2030-10-13T00:00:00.000Z",
    },
    {
      id: "c",
      version: 2,
      summary: "SYN Older completed",
      status: "Completed",
      updated_at: "2030-10-12T00:00:00.000Z",
    },
    {
      id: "a",
      version: 3,
      summary: "SYN Tie A",
      status: "Cancelled",
      updated_at: "2030-10-13T00:00:00.000Z",
    },
  ];
  const before = structuredClone(actions);
  const summary = leadRecordSummary(
    {
      version: 1,
      created_at: "2030-10-12T00:00:00.000Z",
      updated_at: "2030-10-14T00:00:00.000Z",
      actions,
      next_action_state: "Unavailable",
    },
    Date.parse("2030-10-14T00:00:00.000Z"),
  );
  assert.deepEqual(summary.last_activity, actions[2]);
  assert.equal(summary.next_action_state, "Unavailable");
  assert.deepEqual(actions, before);
});
