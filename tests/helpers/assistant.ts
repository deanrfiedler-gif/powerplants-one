import { randomUUID } from 'node:crypto';
import { crmCreate } from './crm';
export function assistantInput(title='SYN Assistant opportunity') {
  const c=crmCreate();
  return {id:randomUUID(),supersedes:null as string|null,values:{company_id:c.company_id,organisation_id:c.organisation_id,site_id:c.site_id,primary_person_id:c.primary_person_id,site_unknown_reason:c.site_unknown_reason,contact_unknown_reason:c.contact_unknown_reason,title,need_summary:c.need_summary,source_channel:c.source_channel,source_basis:c.source_basis,owner_id:c.owner_id,initial_action:{owner_id:c.initial_action.owner_id,kind:c.initial_action.kind,summary:c.initial_action.summary,due_at:c.initial_action.due_at,due_needed:c.initial_action.due_needed}}};
}
