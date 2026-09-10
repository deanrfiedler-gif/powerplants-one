import { randomUUID } from "node:crypto";
import { CRM, crmBase, crmAction } from "./crm";
export const leadCreate = () => ({
  ...crmBase(),
  id: randomUUID(),
  company_id: CRM.company,
  owner_id: CRM.owner,
  organisation_id: CRM.org,
  site_id: CRM.site,
  primary_person_id: CRM.person,
  title: "SYN Greenhouse controls enquiry",
  need_summary: "Review climate controls for the synthetic growing area.",
  organisation_text: null,
  contact_text: null,
  source_channel: "Phone",
  source_basis: "Synthetic manual enquiry for Leads verification.",
});
export const leadConvert = (
  version: number,
  activity_id: string | null = null,
) => ({
  ...crmBase(),
  expected_version: version,
  opportunity_id: randomUUID(),
  organisation_id: CRM.org,
  site_id: CRM.site,
  primary_person_id: CRM.person,
  site_unknown_reason: null,
  contact_unknown_reason: null,
  title: "SYN Qualified greenhouse controls",
  need_summary: "Confirmed need for a climate control review.",
  qualification_note:
    "Synthetic owner confirmed a credible requirement and next action.",
  activity_id,
  new_action: activity_id ? null : crmAction(),
  identification_activity_id: null,
});
