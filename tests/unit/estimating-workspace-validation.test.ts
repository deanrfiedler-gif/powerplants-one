import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { canonical } from "../../src/platform/operations";
import {
  createWorkspaceInput,
  changeWorkspaceInput,
  discoveryChangeProposal,
  optionActionInput,
} from "../../src/estimating/discovery-workspace-validation";
import { discoveryDefinition } from "../../src/estimating/discovery";
import { discoveryInput } from "../helpers/estimating-discovery";
import { crmBase, CRM } from "../helpers/crm";
const invalid = (e: unknown) => (e as { code: string }).code === "InvalidData";
const creation = () => ({
  ...crmBase(),
  id: randomUUID(),
  option_id: randomUUID(),
  revision_id: randomUUID(),
  opportunity_id: randomUUID(),
  discovery: discoveryInput(),
  expected_opportunity_version: 1,
  context_hash: "a".repeat(64),
  confirmed_question_ids: discoveryDefinition.questions.map((q) => q.id),
});
test("E2 command identity rejects unsupported envelopes and client-authored history while canonicalising confirmations", () => {
  const input = creation(),
    original = canonical(input),
    parsed = createWorkspaceInput(input);
  assert.equal(
    canonical(
      createWorkspaceInput({
        ...input,
        confirmed_question_ids: [...input.confirmed_question_ids].reverse(),
      }),
    ),
    canonical(parsed),
  );
  assert.equal(canonical(input), original);
  for (const patch of [
    { schema_version: 2 },
    { owner_id: CRM.owner },
    { state: "Approved" },
    { confirmed_question_ids: ["Q01", "Q01"] },
    { confirmed_question_ids: ["Q99"] },
    { context_hash: "A".repeat(64) },
    { expected_opportunity_version: 0 },
  ])
    assert.throws(() => createWorkspaceInput({ ...input, ...patch }), invalid);
});
test("E2 branch choice cannot combine retained inheritance with caller values or accidentally repurpose a scope successor", () => {
  const base = {
    kind: "Branch",
    branch_mode: "CopyDiscovery",
    option_id: randomUUID(),
    expected_version: 1,
    expected_revision_id: randomUUID(),
    copy_follow_up: { owner_id: CRM.owner, reason: "SYN confirm alternative" },
  };
  assert.equal(discoveryChangeProposal(base).discovery, null);
  for (const patch of [
    { discovery: discoveryInput() },
    { copy_follow_up: null },
    { branch_mode: "Guess" },
    { kind: "Save" },
  ])
    assert.throws(
      () => discoveryChangeProposal({ ...base, ...patch }),
      invalid,
    );
  const save = {
    ...crmBase(),
    kind: "Save",
    option_id: base.option_id,
    expected_version: 1,
    expected_revision_id: base.expected_revision_id,
    discovery: discoveryInput(),
    revision_id: randomUUID(),
    context_hash: "b".repeat(64),
    comparison_hash: "c".repeat(64),
    confirmed_question_ids: [],
  };
  assert.throws(
    () =>
      changeWorkspaceInput(randomUUID(), {
        ...save,
        new_option_id: randomUUID(),
      }),
    invalid,
  );
  assert.throws(
    () =>
      changeWorkspaceInput(randomUUID(), { ...save, answer_attribution: {} }),
    invalid,
  );
  assert.throws(
    () =>
      discoveryChangeProposal({
        ...base,
        copy_follow_up: {
          ...base.copy_follow_up,
          reason: "x".repeat(66000),
        },
      }),
    invalid,
  );
});
test("E2 option transitions require the exact observed selection and do not accept state replacement", () => {
  const input = {
    ...crmBase(),
    action: "Select",
    option_id: randomUUID(),
    expected_version: 2,
    expected_revision_id: randomUUID(),
    expected_selected_option_id: randomUUID(),
  };
  assert.equal(optionActionInput(randomUUID(), input).action, "Select");
  for (const patch of [
    { state: "Active" },
    { action: "Issue" },
    { expected_selected_option_id: null },
    { expected_revision_id: undefined },
    { expected_version: 1.5 },
  ])
    assert.throws(
      () => optionActionInput(randomUUID(), { ...input, ...patch }),
      invalid,
    );
});
