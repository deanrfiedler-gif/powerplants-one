// Reproducible ES02-T52 fixture, exclusively in the disposable synthetic test DB.
// All business records/revisions/costs use native commands. The user display label
// is a fixture-only alias for the seeded synthetic coordinator, not a real login.
import { randomUUID } from "node:crypto";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { createSession } from "../src/platform/identity";
import {
  createOrganisation,
  createSite,
  createFacility,
  createAsset,
} from "../src/shared/commands";
import { createOpportunity } from "../src/crm/opportunities";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
  readDiscoveryWorkspace,
} from "../src/estimating/discovery-workspaces";
import {
  previewDiscoveryCosting,
  adoptDiscoveryCosting,
} from "../src/estimating/cost-basis-service";
import { saveEstimate } from "../src/estimating/service";
import { readEstimate } from "../src/estimating/reads";
import { CRM, crmBase, crmCreate } from "../tests/helpers/crm";
import { structuredDiscovery } from "../tests/helpers/estimating-configuration";
import { emptyConfiguration } from "../src/estimating/configuration-definition";
import type { DiscoveryInput } from "../src/estimating/discovery";

export async function createNorthbankFixture() {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Northbank fixture requires ppo_synthetic_test.");
  const previousOwnerName = (
    await database().query<{ display_name: string }>(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [CRM.workspace, CRM.owner],
    )
  ).rows[0].display_name;
  await mkdir("tmp", { recursive: true });
  await writeFile(
    "tmp/es02-owner-restore.json",
    JSON.stringify({ previousOwnerName }),
  );
  await database().query(
    "UPDATE ppo.users SET display_name='Dean Fiedler' WHERE workspace_id=$1 AND id=$2",
    [CRM.workspace, CRM.owner],
  );
  const p = (await createSession("coordinator")).principal;
  const base = () => ({
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
  });
  const customer = {
    ...base(),
    display_name: "Northbank Nursery",
    legal_name: null,
    relationship_status: "Active",
    owner_id: p.actor_id,
    parent_organisation_id: null,
    sector: "Synthetic nursery",
    notes: "ES-02 synthetic verification fixture",
    access_class: "Internal",
  };
  await createOrganisation(p, customer);
  const site = {
    ...base(),
    display_name: "Caboolture site",
    location_description: "Synthetic Caboolture nursery site",
    timezone: "Australia/Brisbane",
    owner_id: p.actor_id,
    primary_contact_id: null,
    access_instructions: null,
    biosecurity_notes: null,
    parties: [
      {
        organisation_id: customer.id,
        role: "Operator",
        valid_from: "2026-01-01T00:00:00Z",
        valid_to: null,
      },
    ],
  };
  await createSite(p, site);
  const facilities: { id: string }[] = [];
  for (const name of ["Greenhouse 1", "Greenhouse 2", "Irrigation shed"]) {
    const f = { ...base(), site_id: site.id, name, parent_facility_id: null };
    await createFacility(p, f);
    facilities.push(f);
  }
  const assets: { id: string; external_equipment_ref: string }[] = [];
  for (const [description, ref] of [
    ["Climate controller", "EQ-00142"],
    ["Crop monitoring sensor", "EQ-00158"],
  ]) {
    const a = {
      ...base(),
      site_id: site.id,
      description,
      identity_status: "Unresolved",
      facility_id: facilities[0].id,
      external_equipment_ref: ref,
      lifecycle_status: "Active",
      effective_at: "2026-09-21T00:00:00Z",
    };
    await createAsset(p, a);
    assets.push(a);
  }
  const opportunity = {
    ...crmCreate(),
    title: "Northbank climate & irrigation upgrade",
    organisation_id: customer.id,
    site_id: site.id,
    primary_person_id: null,
    contact_unknown_reason: "Synthetic fixture contact not recorded",
  };
  await createOpportunity(p, opportunity);
  const discovery = structuredDiscovery(false);
  discovery.effort = {
    value: "Full",
    source: "Synthetic estimator effort declaration",
    follow_up: null,
  };
  discovery.scope.site_id = site.id;
  discovery.scope.facility_ids = facilities.map((f) => f.id);
  discovery.scope.equipment_ids = assets.map((a) => a.id);
  discovery.scope.systems[0].facility_ids = facilities.map((f) => f.id);
  discovery.configuration.areas.forEach((a, i) => {
    a.facility_id = facilities[i].id;
  });
  discovery.configuration.systems
    .filter((s) => s.intent !== "New")
    .forEach((s, i) => {
      s.equipment_ids = [assets[i].id];
    });
  const first = await previewDiscoveryCreate(p, {
    opportunity_id: opportunity.id,
    discovery,
  });
  const create = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    option_label: "A — Base scope",
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: first.expected_opportunity_version,
    context_hash: first.context_hash,
    confirmed_question_ids: first.required_confirmation_ids,
    configuration_confirmations: first.configuration_confirmations,
  };
  await createDiscoveryWorkspace(p, create);
  const save = async (input: DiscoveryInput) => {
    const d = await readDiscoveryWorkspace(p, create.id),
      proposal = {
        kind: "Save",
        option_id: create.option_id,
        expected_version: d.workspace.version,
        expected_revision_id: d.options[0].revision.id,
        discovery: input,
      },
      preview = await previewDiscoveryChange(p, create.id, proposal),
      command = {
        ...crmBase(),
        ...proposal,
        revision_id: randomUUID(),
        context_hash: preview.context_hash,
        comparison_hash: preview.comparison_hash,
        confirmed_question_ids: preview.required_confirmation_ids,
        configuration_confirmations: preview.configuration_confirmations,
      };
    await changeDiscoveryWorkspace(p, create.id, command);
    return command;
  };
  const complete = structuredClone(discovery);
  for (const f of complete.configuration.facts.filter((f) =>
    ["VerifiedCapacity", "EquipmentModel"].includes(f.field),
  )) {
    f.state = "Confirmed";
    f.value = f.field === "VerifiedCapacity" ? 8 : "SYN observed sensor model";
    f.follow_up = null;
  }
  complete.configuration.follow_ups = [];
  const r02 = await save(complete),
    costing = await previewDiscoveryCosting(p, create.id, {
      option_id: create.option_id,
      revision_id: r02.revision_id,
    }),
    estimate_id = randomUUID();
  const lines = [
    {
      id: randomUUID(),
      description: "Synthetic manually priced upgrade",
      category: "Product",
      quantity: "1",
      unit: "scope",
      unit_cost: "42000.00",
      unit_sell: "58400.00",
      source: "Synthetic manual costing exercise",
      effective_date: "2026-09-21",
      allowance: false,
    },
  ];
  await adoptDiscoveryCosting(p, create.id, {
    ...crmBase(),
    estimate_id,
    option_id: create.option_id,
    revision_id: r02.revision_id,
    expected_workspace_version: costing.expected_workspace_version,
    expected_estimate_version: 0,
    context_hash: costing.context_hash,
    title: opportunity.title,
    scope: {
      included: "Synthetic climate and irrigation upgrade",
      excluded: "No civil works",
      assumptions: "Synthetic manual pricing for owner review",
    },
    lines,
    policy: "SYN-EST-ARITHMETIC-01",
  });
  for (let version = 1; version < 4; version++) {
    const e = await readEstimate(p, estimate_id);
    await saveEstimate(p, estimate_id, {
      ...crmBase(),
      schema_version: 2,
      expected_version: version,
      title: e.saved.title,
      scope: e.saved.scope,
      lines: e.saved.lines,
      policy: e.saved.policy,
    });
  }
  const incomplete = structuredClone(discovery);
  incomplete.configuration.follow_ups.forEach((f) => {
    f.id = randomUUID();
  });
  const r03 = await save(incomplete);
  const fresh: DiscoveryInput = {
    ...structuredClone(discovery),
    configuration: emptyConfiguration(),
    effort: {
      value: "Unknown",
      source: null,
      follow_up: {
        owner_id: p.actor_id,
        reason: "Define alternative B effort",
      },
    },
    scope: {
      mode: "Unknown",
      site_id: null,
      site_reason: "Alternative B site scope not yet established",
      follow_up: {
        owner_id: p.actor_id,
        reason: "Review alternative B location",
      },
      facility_ids: [],
      equipment_ids: [],
      systems: [{ tag: "ProductSupply", facility_ids: [] }],
      unsupported_scope: null,
    },
    answers: discovery.answers.map((a) => ({
      ...a,
      state: "Deferred",
      value: null,
      source: null,
      follow_up: {
        owner_id: p.actor_id,
        reason: "Establish this new alternative independently",
      },
    })),
  };
  for (const mode of ["Fresh", "CopyDiscovery"] as const) {
    const d = await readDiscoveryWorkspace(p, create.id),
      proposal = {
        kind: "Branch",
        branch_mode: mode,
        option_id: create.option_id,
        expected_version: d.workspace.version,
        expected_revision_id: r03.revision_id,
        ...(mode === "Fresh"
          ? { discovery: fresh }
          : {
              copy_follow_up: {
                owner_id: p.actor_id,
                reason: "Review copied Alternative C independently",
              },
              copy_allocation_id: randomUUID(),
            }),
      },
      preview = await previewDiscoveryChange(p, create.id, proposal);
    await changeDiscoveryWorkspace(p, create.id, {
      ...crmBase(),
      ...proposal,
      new_option_id: randomUUID(),
      revision_id: randomUUID(),
      label: mode === "Fresh" ? "B — Fresh scope" : "C — Copied scope",
      context_hash: preview.context_hash,
      comparison_hash: preview.comparison_hash,
      confirmed_question_ids: preview.required_confirmation_ids,
      configuration_confirmations: preview.configuration_confirmations,
    });
  }
  const result = {
    workspace_id: create.id,
    option_id: create.option_id,
    r01: create.revision_id,
    r02: r02.revision_id,
    r03: r03.revision_id,
    estimate_id,
    asset_mappings: assets.map((a) => ({
      id: a.id,
      external_reference: a.external_equipment_ref,
    })),
    route: `/estimating/discovery/${create.id}?step=Configuration`,
    schema: "PPO-ES02-CONFIG-r01",
    commands: { create, r02, r03 },
  };
  return result;
}
export async function restoreFixtureOwner() {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable fixture database only.");
  const prior = JSON.parse(
    await readFile("tmp/es02-owner-restore.json", "utf8"),
  );
  await database().query(
    "UPDATE ppo.users SET display_name=$3 WHERE workspace_id=$1 AND id=$2",
    [CRM.workspace, CRM.owner, prior.previousOwnerName],
  );
}
if (process.argv[1]?.endsWith("es02-fixture.ts")) {
  try {
    if (process.argv[2] === "restore-owner") {
      await restoreFixtureOwner();
    } else {
      const fixture = await createNorthbankFixture();
      await writeFile(
        "tmp/es02-fixture.json",
        JSON.stringify(fixture, null, 2),
      );
      console.log(JSON.stringify(fixture));
    }
  } finally {
    await closeDatabase();
  }
}
