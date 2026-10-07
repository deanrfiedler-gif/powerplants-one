import { readRoute, commandRoute } from "../../../../../shared/http";
import { register } from "../../../../../maintenance/reads";
import { createCase } from "../../../../../maintenance/warranty";
export const GET = readRoute((p,_id,q)=>register(p,"cases",q));
export const POST = commandRoute((p,_id,body)=>createCase(p,body));
