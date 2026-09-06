import { opportunityOptions } from "../../../../../crm/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic="force-dynamic";
export const GET=readRoute((p,_id,q)=>opportunityOptions(p,q));
