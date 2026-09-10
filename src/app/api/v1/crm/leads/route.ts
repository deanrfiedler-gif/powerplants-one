import { listLeads } from "../../../../../crm/leads/reads";
import { createLead } from "../../../../../crm/leads/service";
import { commandRoute, readRoute } from "../../../../../shared/http";
export const dynamic="force-dynamic";
export const GET=readRoute((p,_id,q)=>listLeads(p,q));
export const POST=commandRoute((p,_id,b)=>createLead(p,b));
