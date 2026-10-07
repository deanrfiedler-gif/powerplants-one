import { readRoute, commandRoute } from "../../../../../shared/http";
import { register } from "../../../../../maintenance/reads";
import { createAgreement } from "../../../../../maintenance/agreements";
export const GET = readRoute((p,_id,q)=>register(p,"agreements",q));
export const POST = commandRoute((p,_id,body)=>createAgreement(p,body));
