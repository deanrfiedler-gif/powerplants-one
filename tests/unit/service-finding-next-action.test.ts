import assert from "node:assert/strict";
import { test } from "node:test";
import { nextActionInput } from "../../src/service/findings/next-action";
const id = "90000000-0000-4000-8000-000000000001";
const input = {
  operation_id: id,
  schema_version: 1,
  reason: "SYN follow-up",
  source_token: "a".repeat(64),
  expected_version: 0,
  owner_id: id,
  due_at: "2031-11-10T00:00:00Z",
  instruction: "SYN check",
  required_evidence: null,
};
test("SV07 next-action accepts an exact source, explicit evidence and UTC due instant", () => {
  const command = nextActionInput(`inspection:${id}`, input);
  assert.equal(command.due_at, "2031-11-10T00:00:00.000Z");
  assert.equal(command.source, "inspection");
  assert.equal(command.source_id, id);
  assert.equal(command.expected_version, 0);
  assert.equal(command.required_evidence, null);
});
test("SV07 next-action refuses arbitrary Activity targeting and unbound or incomplete edits", () => {
  for (const patch of [
    { activity_id: id },
    { source_token: "" },
    { expected_version: -1 },
    { expected_version: 0.5 },
    { expected_version: "1" },
    { due_at: null },
    { due_at: "2031-11-10" },
    { instruction: "" },
    { instruction: "x".repeat(2001) },
    { required_evidence: undefined },
    { required_evidence: "" },
    { required_evidence: "x".repeat(4001) },
    { owner_id: "other" },
    { source: "schedule" },
  ])
    assert.throws(() =>
      nextActionInput(`inspection:${id}`, { ...input, ...patch }),
    );
});
