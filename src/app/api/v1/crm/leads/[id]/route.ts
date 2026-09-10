import { readLead } from "../../../../../../crm/leads/reads";
import { changeLead } from "../../../../../../crm/leads/service";
import { commandRoute, readRoute } from "../../../../../../shared/http";
export const dynamic="force-dynamic";
export const GET=readRoute((p,id)=>readLead(p,id));
export const POST=commandRoute((p,id,b)=>changeLead(p,id,b),false);
