import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
} from "../../src/estimating/discovery-workspaces";
import { readNursery } from "../../src/estimating/nursery-automation/service";
import { blankScenario } from "../../src/estimating/nursery-automation/model";
import { crmCreate, crmBase } from "./crm";
import { discoveryInput } from "./estimating-discovery";
export async function nurseryFixture(
  incomplete = false,
  discovery = discoveryInput(),
) {
  const session = await createSession("coordinator"),
    p = session.principal,
    opportunity = crmCreate();
  opportunity.title = "SYN Nursery potting discovery";
  await createOpportunity(p, opportunity);
  if (incomplete)
    discovery.answers[0] = {
      question_id: "Q01",
      state: "Deferred",
      value: null,
      source: null,
      follow_up: {
        owner_id: p.actor_id,
        reason: "SYN scope still needs confirmation",
      },
    };
  const preview = await previewDiscoveryCreate(p, {
    opportunity_id: opportunity.id,
    discovery,
  });
  const id = randomUUID(),
    option_id = randomUUID(),
    revision_id = randomUUID();
  await createDiscoveryWorkspace(p, {
    ...crmBase(),
    reason: "SYN nursery source",
    id,
    option_id,
    revision_id,
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  const detail = await readNursery(p, id, { option_id });
  const proposal = structuredClone(detail.proposal);
  proposal.system_id = detail.source.systems[0]?.id ?? null;
  proposal.name = "SYN Standard and Plus study";
  proposal.candidate_ids = ["javo-standard-2-0", "javo-plus"];
  proposal.scenarios = [blankScenario(randomUUID())];
  proposal.scenarios[0].facts.diameter_mm = {
    value: null,
    knowledge: "Conflict",
    source: null,
    alternatives: [
      { value: "55", source: "SYN brief A" },
      { value: "60", source: "SYN brief B" },
    ],
    owner: "SYN estimator",
    next_action: "Obtain sample",
  };
  return { p, session, id, option_id, revision_id, proposal, detail };
}
export const nurseryCommand = (d: Awaited<ReturnType<typeof readNursery>>) => ({
  ...crmBase(),
  reason: "SYN saved Nursery revision",
  option_id: d.option.id,
  source_revision_id: d.source.id,
  source_hash: d.source.hash,
  expected_workspace_version: d.workspace.version,
  expected_revision_id: d.current_revision_id,
  catalogue_hash: d.catalogue_hash,
  proposal: structuredClone(d.proposal),
});
