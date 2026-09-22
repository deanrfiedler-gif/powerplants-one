import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  previewDiscoveryCreate,
  createDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import { createScope } from "../../src/estimating/fertigation/service";
import { readScope } from "../../src/estimating/fertigation/reads";
import {
  blankScope,
  blankValve,
  blankMaster,
} from "../../src/estimating/fertigation/definition";
import { crmCreate, crmBase } from "./crm";
import { discoveryInput, discoveryFacility } from "./estimating-discovery";
export const fertigationBase = () => ({
  ...crmBase(),
  reason: "SYN native fertigation contract proof",
});
export async function fertigationFixture() {
  const session = await createSession("coordinator"),
    p = session.principal,
    opportunity = crmCreate();
  opportunity.title = "SYN Berries fertigation source";
  await createOpportunity(p, opportunity);
  const discovery = discoveryInput();
  discovery.answers[0].value =
    "SYN commercial berries scope; supplier configuration remains unverified";
  const preview = await previewDiscoveryCreate(p, {
    opportunity_id: opportunity.id,
    discovery,
  });
  const workspaceId = randomUUID(),
    optionId = randomUUID(),
    revisionId = randomUUID();
  await createDiscoveryWorkspace(p, {
    ...fertigationBase(),
    id: workspaceId,
    option_id: optionId,
    revision_id: revisionId,
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  const proposal = blankScope();
  proposal.name = "SYN saved berry study";
  proposal.production_context = {
    ...proposal.production_context,
    tags: ["commercial_berries"],
    crop_description: "SYN commercial berry reference",
    hydraulic_arrangement: "single_pass",
    application_method: "drip",
    source_note: "Authored synthetic proof",
  };
  const master = blankMaster(randomUUID());
  master.label = "SYN mainline isolation";
  master.phase = "proposed";
  const valve = blankValve(randomUUID());
  valve.label = "SYN north irrigation valve";
  valve.phase = "proposed";
  valve.master_id = master.id;
  valve.flow_basis = "design_allowance";
  valve.design_flow_m3h = 2.5;
  valve.control = {
    ...valve.control,
    owner: "manual",
    additional_channels: 0,
    basis: "SYN hand-operated valve; no physical output",
  };
  proposal.masters = [master];
  proposal.valves = [valve];
  const create = {
    ...fertigationBase(),
    id: randomUUID(),
    name: proposal.name,
    estimating_workspace_id: workspaceId,
    option_id: optionId,
    revision_id: revisionId,
    expected_workspace_version: 1,
    coverage: {
      system_id: null,
      area_ids: [],
      facility_ids: [discoveryFacility],
    },
    proposal,
  };
  const accepted = await createScope(p, create),
    detail = await readScope(p, create.id);
  return {
    p,
    session,
    create,
    accepted,
    detail,
    proposal,
    workspaceId,
    optionId,
    revisionId,
  };
}
export function saveCommand(detail: Awaited<ReturnType<typeof readScope>>) {
  return {
    ...fertigationBase(),
    expected_version: detail.scope.version,
    expected_revision_id: detail.revision.id,
    source_context_hash: detail.revision.binding.upstream_context_hash,
    proposal: structuredClone(detail.revision.proposal),
  };
}
