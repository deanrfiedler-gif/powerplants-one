import { planLeadAction } from "../../../../../../../crm/leads/service";
import { commandRoute } from "../../../../../../../shared/http";
export const dynamic="force-dynamic";
export const POST=commandRoute((p,id,b)=>planLeadAction(p,id,b),false);
