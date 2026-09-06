import { listOpportunities } from "../../../../../crm/reads";
import { createOpportunity } from "../../../../../crm/opportunities";
import { commandRoute, readRoute } from "../../../../../shared/http";
export const dynamic="force-dynamic";
export const GET=readRoute((p,_id,q)=>listOpportunities(p,q));
export const POST=commandRoute((p,_id,b)=>createOpportunity(p,b));
