import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { parseCreationReview } from "../../src/estimating/discovery-creation-review";
import { createWorkspaceInput, discoveryCreateProposal } from "../../src/estimating/discovery-workspace-validation";
import { compileDiscovery } from "../../src/estimating/discovery";
import { canonical } from "../../src/platform/operations";
import { discoveryInput } from "../helpers/estimating-discovery";

test("legacy creation canonical payload does not acquire an omitted review property", () => {
  const proposal = { opportunity_id: randomUUID(), discovery: discoveryInput() };
  const parsed = discoveryCreateProposal(proposal);
  assert.equal(Object.hasOwn(parsed, "creation"), false);
  assert.equal(canonical(parsed), canonical({ ...proposal, discovery: compileDiscovery(proposal.discovery).input }));
  const command = { ...proposal, operation_id: randomUUID(), schema_version: 1, reason: "SYN initial scope",
    id: randomUUID(), option_id: randomUUID(), revision_id: randomUUID(), expected_opportunity_version: 1,
    context_hash: "a".repeat(64), confirmed_question_ids: ["Q06", "Q01"] };
  assert.equal(canonical(createWorkspaceInput(command)), canonical({ ...command,
    discovery: compileDiscovery(command.discovery).input, confirmed_question_ids: ["Q01", "Q06"] }));
});

test("review distinguishes an explicit absent brief from missing or malformed intent", () => {
  const owner_id = randomUUID();
  assert.deepEqual(parseCreationReview({ owner_id, sales_brief: null }), { owner_id, sales_brief: null });
  for (const value of [undefined, null, { owner_id }, { owner_id, sales_brief: undefined },
    { owner_id: "display name", sales_brief: null }, { owner_id, sales_brief: null, receiving_owner_id: randomUUID() }])
    assert.throws(() => parseCreationReview(value));
});

test("an accepted brief selection retains every exact identity and rejects incomplete selections", () => {
  const owner_id = randomUUID(), sales_brief = { handover_id: randomUUID(), acceptance_event_id: randomUUID(),
    expected_version: 4, source_hash: "b".repeat(64) };
  assert.deepEqual(parseCreationReview({ owner_id, sales_brief }), { owner_id, sales_brief });
  for (const patch of [{ acceptance_event_id: undefined }, { expected_version: 0 }, { expected_version: "4" },
    { source_hash: "b".repeat(63) }, { source_hash: "B".repeat(64) }, { handover_id: "SYN-PPO-OPP-000026" }])
    assert.throws(() => parseCreationReview({ owner_id, sales_brief: { ...sales_brief, ...patch } }));
});
