import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession, type Principal } from "../../src/platform/identity";
import {
  createCostSource,
  decideCostSource,
} from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import { sourceContent } from "../../src/estimating/sources/validation";
import { sourceHash } from "../../src/estimating/sources/context";
import {
  saveRelease,
  reviewRelease,
  activateRelease,
} from "../../src/cpq/releases";
import { readRelease, readRun } from "../../src/cpq/reads";
import { previewCalculation, calculateRun } from "../../src/cpq/runs";
import { definition } from "../../src/cpq/validation";
import type { CostReference, Definition } from "../../src/cpq/types";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  previewDiscoveryCreate,
  createDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import { discoveryInput } from "./estimating-discovery";
import { sourceInput } from "./estimating-sources";
import { cpqDefinition, cpqInput } from "./cpq";
import { CRM, crmBase, crmCreate } from "./crm";

export function costReference(unit = "each", cost = "8"): CostReference {
  const content = sourceContent({
    ...sourceInput().content,
    unit,
    tiers: [
      { minimum_quantity: "0.001", unit_cost: cost },
      { minimum_quantity: "10", unit_cost: unit === "each" ? "7" : "35" },
    ],
  });
  return {
    source_id: randomUUID(),
    revision_id: randomUUID(),
    review_event_id: randomUUID(),
    content_hash: sourceHash(content),
    source_version: 3,
    reference: "SYN-CPQ-COST",
    revision: 1,
    content,
  };
}
export function costDefinition(
  refs = [costReference(), costReference("hour", "40")],
): Definition {
  const d = cpqDefinition();
  d.schema_version = 4;
  d.parts.forEach((part, i) => {
    part.cost_source = refs[i];
    part.tiers.forEach((t) => (t.unit_cost = "0.00"));
  });
  d.fixtures[0].expected.cost = "56.00";
  return definition(d);
}
export async function costActors() {
  const p = (await createSession("coordinator")).principal;
  const reviewer = (await createSession("products-reviewer")).principal;
  const publisher = (await createSession("products-publisher")).principal;
  for (const [actor, caps] of [
    [p, ["cpq.read", "cpq.author", "cpq.calculate"]],
    [reviewer, ["cpq.read", "cpq.review", "estimating.read"]],
    [publisher, ["cpq.read", "cpq.publish", "estimating.read"]],
  ] as const)
    for (const cap of caps)
      await database().query(
        "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3) ON CONFLICT DO NOTHING",
        [CRM.workspace, actor.actor_id, CRM.company, cap],
      );
  return { p, reviewer, publisher };
}
export async function reviewedCost(p: Principal, unit = "each", cost = "8") {
  const input = {
    ...sourceInput(),
    content: costReference(unit, cost).content,
  };
  await createCostSource(p, input);
  const initial = await readCostSource(p, input.id);
  await decideCostSource(p, input.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: initial.revision.id,
    action: "Submit",
  });
  await decideCostSource(
    (await createSession("estimating-source-reviewer")).principal,
    input.id,
    {
      ...crmBase(),
      expected_version: 2,
      revision_id: initial.revision.id,
      action: "Reviewed",
    },
  );
  return await costRef(p, input.id);
}
export async function costRef(
  p: Principal,
  id: string,
): Promise<CostReference> {
  const view = await readCostSource(p, id);
  const event = (
    await database().query(
      "SELECT id FROM ppo.cost_source_events WHERE source_id=$1 AND revision_id=$2 AND action='Reviewed'",
      [id, view.revision.id],
    )
  ).rows[0];
  return {
    source_id: id,
    revision_id: view.revision.id,
    content_hash: view.revision.content_hash,
    review_event_id: event?.id ?? randomUUID(),
    source_version: view.source.version,
    reference: view.source.reference,
    revision: view.revision.revision,
    content: view.revision.content,
  };
}
export async function publishCosts(
  actors: Awaited<ReturnType<typeof costActors>>,
  d: Definition,
) {
  const command = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    expected_version: 0,
    definition: d,
  };
  await saveRelease(actors.p, command);
  const view = await readRelease(actors.p, command.id);
  await reviewRelease(actors.reviewer, command.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
    outcome: "Approved",
  });
  const version = (
    await database().query(
      "SELECT coalesce(max(version),0)::integer AS version FROM ppo.cpq_activations WHERE company_id=$1",
      [CRM.company],
    )
  ).rows[0].version;
  await activateRelease(actors.publisher, command.id, {
    ...crmBase(),
    expected_version: 2,
    revision_id: view.current.id,
    content_hash: view.current.content_hash,
    expected_activation_version: version,
  });
  return view;
}
export async function costDiscovery(p: Principal) {
  const opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const discovery = discoveryInput();
  const preview = await previewDiscoveryCreate(p, {
    opportunity_id: opportunity.id,
    discovery,
  });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  };
  await createDiscoveryWorkspace(p, input);
  return {
    id: input.id,
    option_id: input.option_id,
    revision_id: input.revision_id,
  };
}
export async function calculateCosts(
  p: Principal,
  g: Awaited<ReturnType<typeof costDiscovery>>,
  parent_id: string | null = null,
  input = cpqInput(),
) {
  const basis = await previewCalculation(p, g.id, {
    option_id: g.option_id,
    revision_id: g.revision_id,
  });
  const command = {
    ...crmBase(),
    id: randomUUID(),
    option_id: g.option_id,
    revision_id: g.revision_id,
    binding_hash: basis.binding_hash,
    parent_id,
    input,
  };
  const receipt = await calculateRun(p, g.id, command);
  return { command, receipt, run: await readRun(p, command.id), basis };
}
