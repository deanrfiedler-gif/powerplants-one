import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  parseEngineeringRequest,
  parseEngineeringCoordination,
} from "../../src/engineering/validation";
import { requiresAttention } from "../../src/engineering/model";
import { actionsForCapabilities } from "../../src/shell/model";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN Review",
});
const input = () => ({
  ...base(),
  id: randomUUID(),
  title: "SYN Pump station",
  brief: "Check the arrangement.\nConfirm access.",
  context_kind: "Project",
  context_id: randomUUID(),
  owner_id: randomUUID(),
  discipline: "Mechanical",
  required_date: null,
  next_action: "Confirm scope",
  action_due: "2026-09-16",
});
test("engineering intake retains unknown package dates and separate action commitments", () => {
  const parsed = parseEngineeringRequest(input());
  assert.equal(parsed.required_date, null);
  assert.equal(parsed.action_due, "2026-09-16");
  assert.ok(parsed.brief.includes("\n"));
  for (const changes of [
    { state: "Released" },
    { title: " " },
    { context_kind: "Unverified" },
    { discipline: "Unknown" },
    { required_date: "2026-02-30" },
  ])
    assert.throws(() => parseEngineeringRequest({ ...input(), ...changes }));
});
test("coordination cannot approve or issue a design and requires an owned missing-input description", () => {
  const fields = {
    ...base(),
    expected_version: 1,
    owner_id: randomUUID(),
    state: "Queued",
    required_date: null,
    next_action: "Review scope",
    action_due: null,
    blocker: null,
  };
  for (const changes of [
    { state: "Released" },
    { state: "Ready to issue" },
    { state: "Awaiting information" },
    { blocker: "Unresolved input" },
    { expected_version: 0 },
  ])
    assert.throws(() =>
      parseEngineeringCoordination(randomUUID(), { ...fields, ...changes }),
    );
  assert.equal(
    parseEngineeringCoordination(randomUUID(), {
      ...fields,
      state: "Awaiting information",
      blocker: "Confirm pressure data",
    }).blocker,
    "Confirm pressure data",
  );
});
test("attention includes actual overdue commitments without inventing overdue unknown dates", () => {
  assert.equal(
    requiresAttention(
      { required_date: null, action_due: null, blocker: null },
      "2026-09-10",
    ),
    false,
  );
  assert.equal(
    requiresAttention(
      { required_date: "2026-09-20", action_due: "2026-09-09", blocker: null },
      "2026-09-10",
    ),
    true,
  );
  assert.equal(
    requiresAttention(
      { required_date: null, action_due: null, blocker: "Input needed" },
      "2026-09-10",
    ),
    true,
  );
});
test("engineering quick add requires both read and create permissions", () => {
  assert.deepEqual(actionsForCapabilities(new Set(["engineering.create"])), []);
  assert.deepEqual(actionsForCapabilities(new Set(["engineering.read"])), []);
  assert.equal(
    actionsForCapabilities(
      new Set(["engineering.read", "engineering.create"]),
    )[0].href,
    "/engineering?create=1",
  );
});
