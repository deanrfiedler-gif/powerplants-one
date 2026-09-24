import { readRoute, commandRoute } from "../../../../../shared/http";
import { register } from "../../../../../maintenance/reads";
import { createClaim } from "../../../../../maintenance/recovery";
export const GET = readRoute((p,_id,q)=>register(p,"recovery",q));
export const POST = commandRoute((p,_id,body)=>createClaim(p,body));
