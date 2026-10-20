import { discoveryDefinition, discoveryDefinitionHash } from "../../src/estimating/discovery";
import { equipmentCatalogue, equipmentCatalogueDefinition } from "../../src/estimating/equipment-catalogue";
import { emptyHandover } from "../../src/sales/handover-model";
import type { FormOptions } from "../../src/components/discovery-fields";
import type { CreationContext } from "../../src/components/discovery-creation-model";
import { CRM } from "./crm";

// Synthetic API observations for deterministic UI states; not database acceptance.
export const creationIds = {
  opportunity: "ed020000-0000-4000-8000-000000000001",
  handover: "ed020000-0000-4000-8000-000000000002",
  acceptance: "ed020000-0000-4000-8000-000000000003",
  estimator: "ed020000-0000-4000-8000-000000000004",
  existing: "ed020000-0000-4000-8000-000000000005",
};
export const creationFormFixture: FormOptions = {
  opportunity: { id: creationIds.opportunity, title: "Northbank controls expansion", version: 4, site_id: CRM.site },
  owner: { id: CRM.owner, display_name: "Riley" },
  definition: discoveryDefinition,
  definition_hash: discoveryDefinitionHash,
  configuration_catalogue: { schema_version: 2, definition_id: equipmentCatalogueDefinition, families: equipmentCatalogue, shared_infrastructure: { family: "Infrastructure", category_id: null } },
  sites: [{ id: CRM.site, display_name: "Northbank — Glasshouse site", version: 1 }],
  facilities: [], equipment: [],
  owners: [{ id: CRM.owner, display_name: "Riley" }, { id: creationIds.estimator, display_name: "Morgan" }],
  limits: { sites: 100, facilities: 100, equipment: 100 },
  more: { sites: false, facilities: false, equipment: false },
};
export const creationContextFixture: CreationContext = {
  opportunity: { id: creationIds.opportunity, title: creationFormFixture.opportunity.title, display_number: "SYN-PPO-OPP-000042", organisation_id: CRM.org, customer: "Northbank Nursery", site: creationFormFixture.sites[0].display_name },
  owner_id: CRM.owner,
  estimators: creationFormFixture.owners,
  more_estimators: false,
  brief: {
    handover_id: creationIds.handover, state: "Accepted", revision: 2,
    receiver: "Riley", accepted_at: new Date("2026-10-18T00:00:00Z"), source_changed: false,
    selection: { handover_id: creationIds.handover, acceptance_event_id: creationIds.acceptance, expected_version: 4, source_hash: "a".repeat(64) },
    content: { ...emptyHandover(), problem: "SYN: improve monitoring across the growing areas.", outcome: "SYN: operators can review the controls basis.", included_scope: "Extend the controls to the new growing areas and confirm the required monitoring points.", exclusions: "No civil works or mains electrical work included.", assumptions: "Existing control network can be reviewed during discovery.", unknowns: "SYN: confirm network condition on site." },
  },
};
export const creationChoicesFixture = {
  items: [
    { id: creationIds.opportunity, display_number: creationContextFixture.opportunity.display_number, title: creationContextFixture.opportunity.title, company_id: CRM.company, site_id: CRM.site, customer: "Northbank Nursery", site: creationFormFixture.sites[0].display_name, brief: { state: "Accepted", revision: 2 } },
    { id: "ed020000-0000-4000-8000-000000000006", display_number: "SYN-PPO-OPP-000041", title: "Eastvale irrigation review", company_id: CRM.company, site_id: null, customer: "Eastvale Growers", site: null, brief: null },
  ],
  limit: 100, bounded: true,
};
