import {
  discoveryDefinitionHash,
  type Answer,
  type DiscoveryInput,
} from "../../src/estimating/discovery";
import { CRM } from "./crm";
export const discoveryFacility = "72000000-0000-4000-8000-000000000001";
export const discoveryEquipment = "80000000-0000-4000-8000-000000000002";
const answer = (question_id: string, value: Answer["value"]): Answer => ({
  question_id,
  value,
  state: "Confirmed",
  source: "SYN recorded scoping evidence",
  follow_up: null,
});
export const discoveryInput = (): DiscoveryInput => ({
  definition_id: "SYN-E2-QUESTIONS",
  definition_revision: "r01",
  definition_hash: discoveryDefinitionHash,
  effort: {
    value: "Express",
    source: "SYN estimator declared effort",
    follow_up: null,
  },
  scope: {
    mode: "Site",
    site_id: CRM.site,
    site_reason: null,
    follow_up: null,
    facility_ids: [discoveryFacility],
    equipment_ids: [discoveryEquipment],
    systems: [{ tag: "ProductSupply", facility_ids: [discoveryFacility] }],
    unsupported_scope: null,
  },
  answers: [
    answer("Q01", "SYN replace one sensor"),
    answer("Q02", { choice: "NoneDeclared" }),
    answer("Q03", "SYN equipment identity still needs technical verification"),
    answer("Q04", "NotRequired"),
    answer("Q05", "SYN sensor reference"),
    answer("Q06", 1),
  ],
});
