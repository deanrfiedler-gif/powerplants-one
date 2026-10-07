import { readRoute, commandRoute } from "../../../../../shared/http";
import { register } from "../../../../../maintenance/reads";
import { createRenewal } from "../../../../../maintenance/renewals";
export const GET = readRoute((p,_id,q)=>register(p,"renewals",q));
export const POST = commandRoute((p,_id,body)=>createRenewal(p,body));
