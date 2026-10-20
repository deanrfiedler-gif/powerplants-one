import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createHandover } from "../../src/sales/handover-service";
import { discoveryCreationChoices, existingCreationWorkspace } from "../../src/estimating/discovery-creation-reads";
import { discoveryCreationOptions } from "../../src/estimating/discovery-creation-context";
import { createDiscoveryWorkspace, previewDiscoveryCreate } from "../../src/estimating/discovery-workspaces";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable synthetic test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

test("creation reads preserve eligible labels and enforce current workspace visibility on collision", async () => {
  const p = (await createSession("coordinator")).principal;
  const opportunity = crmDiscovery();
  opportunity.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  opportunity.initial_action.due_needed = false;
  await createOpportunity(p, opportunity);
  await createHandover(p, { ...crmBase(), id: randomUUID(), opportunity_id: opportunity.id, kind: "Estimating" });
  const choice = (await discoveryCreationChoices(p)).items.find(o => o.id === opportunity.id);
  assert.ok(choice);
  assert.equal(choice.title, opportunity.title);
  assert.equal(choice.brief?.state, "Draft");
  const context = await discoveryCreationOptions(p, { opportunity_id: opportunity.id });
  assert.equal(context.opportunity.title, choice.title);
  assert.equal(context.opportunity.display_number, choice.display_number);

  const proposal = { opportunity_id: opportunity.id, discovery: discoveryInput() };
  const preview = await previewDiscoveryCreate(p, proposal);
  const input = { ...crmBase(), ...proposal, id: randomUUID(), option_id: randomUUID(), revision_id: randomUUID(),
    expected_opportunity_version: preview.expected_opportunity_version, context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    reason: "SYN creation read proof" };
  await createDiscoveryWorkspace(p, input);
  assert.equal((await discoveryCreationChoices(p)).items.some(o => o.id === opportunity.id), false);
  const existing = await existingCreationWorkspace(p, { opportunity_id: opportunity.id });
  assert.equal(existing.id, input.id);
  assert.equal(existing.creator, p.display_name);
  assert.ok(existing.created_at);
  const denied = (error: unknown) => [403, 404].includes((error as { status: number }).status);
  await assert.rejects(existingCreationWorkspace({ ...p, workspace_id: randomUUID() }, { opportunity_id: opportunity.id }), denied);
  await database().query("UPDATE ppo.permission_grants SET valid_to=now() WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.read' AND valid_to IS NULL", [p.workspace_id, p.actor_id]);
  await assert.rejects(existingCreationWorkspace(p, { opportunity_id: opportunity.id }), denied);
});
