import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  previewDiscoveryCreate,
  createDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import {
  previewDiscoveryCosting,
  adoptDiscoveryCosting,
} from "../../src/estimating/cost-basis-service";
import {
  createConfiguration,
  previewConfiguration,
  saveRun,
} from "../../src/estimating/specialist/service";
import {
  fixtureIds,
  fixtureProposal,
  receivingPolicy,
  receivingPolicyHash,
} from "../../src/estimating/specialist/fixture-policy";
import {
  configuration,
  draft,
  resolved,
} from "../../src/estimating/specialist/context";
import { estimateContext } from "../../src/estimating/context";
import { database } from "../../src/platform/database";
import { crmBase, crmCreate } from "./crm";
import { discoveryInput } from "./estimating-discovery";
import type { Principal } from "../../src/platform/identity";
export const base = () => ({
  ...crmBase(),
  reason: "SYN ES08 authored fixture proof",
});
export async function specialistFixture(save = false) {
  const p = (await createSession("coordinator")).principal,
    opportunity = {
      ...crmCreate(),
      id: fixtureIds.opportunity,
      title: "SYN Northbank Screen Systems replacement study",
    };
  await createOpportunity(p, opportunity);
  const discovery = discoveryInput();
  discovery.scope.equipment_ids = [];
  discovery.answers = discovery.answers.map((a) =>
    a.question_id === "Q01"
      ? { ...a, value: "SYN Screen Systems replacement study" }
      : a,
  );
  const preview = await previewDiscoveryCreate(p, {
    opportunity_id: opportunity.id,
    discovery,
  });
  await createDiscoveryWorkspace(p, {
    ...base(),
    id: fixtureIds.estimating_workspace,
    option_id: fixtureIds.option,
    revision_id: fixtureIds.revision,
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  const basis = await previewDiscoveryCosting(
    p,
    fixtureIds.estimating_workspace,
    { option_id: fixtureIds.option, revision_id: fixtureIds.revision },
  );
  const manualId = randomUUID();
  await adoptDiscoveryCosting(p, fixtureIds.estimating_workspace, {
    ...base(),
    estimate_id: fixtureIds.estimate,
    option_id: fixtureIds.option,
    revision_id: fixtureIds.revision,
    expected_workspace_version: 1,
    expected_estimate_version: 0,
    context_hash: basis.context_hash,
    title: "SYN Northbank Screen Systems estimate",
    scope: {
      included: "Explicit synthetic screen contribution",
      excluded: "Ordering, installation and engineering release",
      assumptions: "Authored synthetic fixture rates, excluding tax",
    },
    lines: [
      {
        id: manualId,
        description: "SYN unrelated manual allowance",
        category: "Product",
        allowance: false,
        quantity: "1",
        unit: "each",
        unit_cost: "5.00",
        unit_sell: "8.00",
        source: "SYN independent authored example",
        effective_date: "2026-09-21",
      },
    ],
    policy: "SYN-EST-ARITHMETIC-01",
  });
  const proposal = fixtureProposal();
  const create = {
    ...base(),
    id: fixtureIds.configuration,
    name: "SYN Northbank Screen Systems",
    estimating_workspace_id: fixtureIds.estimating_workspace,
    option_id: fixtureIds.option,
    revision_id: fixtureIds.revision,
    coverage: {
      kind: "FacilityScope",
      system_id: null,
      area_ids: [],
      facility_ids: [fixtureIds.facility],
    },
    proposal,
    expected_workspace_version: 1,
  };
  await createConfiguration(p, create);
  if (save) await saveFixtureRun(p);
  return { p, manualId, proposal, create };
}
export async function saveFixtureRun(p: Principal, changed = false) {
  const cfg = await configuration(database(), p, fixtureIds.configuration),
    proposal = fixtureProposal(changed),
    preview = await previewConfiguration(p, cfg.id, {
      expected_version: cfg.version,
      proposal,
      decisions: [],
    });
  return saveRun(p, cfg.id, {
    ...base(),
    expected_version: cfg.version,
    proposal,
    decisions: [],
    proposal_signature: preview.proposal_signature,
  });
}
export async function receivingInput(p: Principal) {
  const c = database(),
    cfg = await configuration(c, p, fixtureIds.configuration),
    d = await draft(c, p, cfg),
    set = await resolved(c, p, cfg, cfg.current_resolved_id!),
    e = await estimateContext(c, p, fixtureIds.estimate);
  return {
    run_id: cfg.current_run_id!,
    resolved_set_id: set.id,
    resolved_set_hash: set.content_hash,
    estimate_id: e.id,
    estimate_version_id: e.current_version_id,
    expected_configuration_version: cfg.version,
    expected_workspace_version: d.g.version,
    expected_estimate_version: e.version,
    discovery_revision_id: d.d.binding.revision_id,
    source_context_hash: d.d.binding.context_hash,
    receiving_policy_id: receivingPolicy.id,
    receiving_policy_hash: receivingPolicyHash,
    decisions: [],
    price_and_unit_proposals: receivingPolicy.mappings.map((m) => ({
      key: m.key,
      unit_cost: "1.00",
      unit_sell: "2.00",
      effective_date: "2026-09-21",
      reason: "Authored synthetic AUD fixture per exact calculation unit",
    })),
  };
}
