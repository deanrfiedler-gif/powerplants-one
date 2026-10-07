import { readRoute } from "../../../../../shared/http";
import { register } from "../../../../../maintenance/reads";
export const GET = readRoute((p,_id,q)=>register(p,"due",q));
