import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "./crm";
export const raidInput = (expected_version = 0) => ({
  ...crmBase(), id:randomUUID(), expected_version, kind:"Risk", title:"SYN Supplier lead-time risk",
  detail:"SYN The delivery date needs confirmation before site work is planned.", owner_id:CRM.owner,
  priority:"High", due_at:null as string|null, due_needed:true, response:"SYN Ask the package owner to confirm the date.",
  interface_notes:"SYN Procurement confirms availability; Projects records the forecast.", state:"Open", outcome:null as string|null, action_ids:[] as string[],
});
export const raidAction = (project_id: string) => ({
  ...crmBase(), id:randomUUID(), company_id:CRM.company, site_id:CRM.site, kind:"TechnicalFollowUp", owner_id:CRM.owner,
  summary:"SYN Confirm the supplier forecast", due_at:null, due_needed:true, access_class:"Internal",
  links:[{object_type:"Project",object_id:project_id}],
});
