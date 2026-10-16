import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { commandInput } from "../../src/projects/specialist/work/validation";
const input = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  id: randomUUID(),
  expected_version: 0,
  action: "Submit",
  reason: "SYN reason",
  note: "SYN evidence",
  handover_id: randomUUID(),
  document_id: randomUUID(),
  revision_id: randomUUID(),
  reviewer_id: randomUUID(),
  scope: "Section A",
  limitations: "Section B excluded",
  predecessor_id: null,
});
test("PJ06-R3 inputs retain explicit scope/limits and reject forged source authority or rewritten decisions", () => {
  const v = input(),
    project = randomUUID();
  assert.equal(commandInput(project, v).submission?.limitations, v.limitations);
  for (const patch of [
    { source: {} },
    { payload_hash: "a" },
    { scope: "" },
    { limitations: "" },
    { expected_version: 1 },
    { reviewer_id: "unknown" },
  ])
    assert.throws(() => commandInput(project, { ...v, ...patch }));
  assert.throws(() =>
    commandInput(project, { ...v, action: "Accept", expected_version: 1 }),
  );
  const decision = {
    schema_version: 1,
    operation_id: v.operation_id,
    id: v.id,
    expected_version: 1,
    action: "Return",
    reason: v.reason,
    note: v.note,
  };
  assert.equal(commandInput(project, decision).submission, null);
  assert.throws(() =>
    commandInput(project, { ...decision, expected_version: 2 }),
  );
});
