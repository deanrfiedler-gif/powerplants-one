import { randomUUID } from "node:crypto";
export const CRM = {
  workspace: "10000000-0000-4000-8000-000000000001",
  company: "20000000-0000-4000-8000-000000000001",
  companyB: "20000000-0000-4000-8000-000000000002",
  owner: "30000000-0000-4000-8000-000000000001",
  org: "50000000-0000-4000-8000-000000000001",
  orgB: "50000000-0000-4000-8000-000000000003",
  site: "70000000-0000-4000-8000-000000000001",
  person: "60000000-0000-4000-8000-000000000001",
  definition: "c1000000-0000-4000-8000-000000000001",
};
export const crmBase = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN I1 behaviour verification",
});
export const crmAction = (owner = CRM.owner) => ({
  id: randomUUID(),
  owner_id: owner,
  kind: "CustomerContact",
  summary: "SYN Identify the controls upgrade need",
  due_at: null as string | null,
  due_needed: true,
});
export const crmCreate = () => ({
  ...crmBase(),
  id: randomUUID(),
  company_id: CRM.company,
  organisation_id: CRM.org,
  site_id: CRM.site as string | null,
  primary_person_id: CRM.person as string | null,
  site_unknown_reason: null as string | null,
  contact_unknown_reason: null as string | null,
  title: "SYN Controls upgrade qualification",
  need_summary: "Understand irrigation monitoring needs before any proposal.",
  source_channel: "Phone",
  source_basis: "Fictional conversation for I1 verification",
  owner_id: CRM.owner,
  pipeline_definition_id: CRM.definition,
  initial_action: crmAction(),
});
export const crmQualify = (version = 1) => ({
  ...crmBase(),
  expected_version: version,
  pipeline_definition_id: CRM.definition,
  need_summary: "SYN Reviewed monitoring need",
  qualification_note:
    "SYN Contact explained desired monitoring outcome; no order or financial authority.",
  identification_activity_id: null as string | null,
});
