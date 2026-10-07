import { readRoute, commandRoute } from "../../../../../shared/http";
import { register } from "../../../../../maintenance/reads";
import { createPlan } from "../../../../../maintenance/plans";
export const GET = readRoute((p,_id,q)=>register(p,"plans",q));
export const POST = commandRoute((p,_id,body)=>createPlan(p,body));
