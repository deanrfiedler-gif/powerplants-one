import { leadOptions } from "../../../../../../crm/leads/reads";
import { readRoute } from "../../../../../../shared/http";
export const dynamic="force-dynamic";
export const GET=readRoute((p,_id,q)=>leadOptions(p,q));
