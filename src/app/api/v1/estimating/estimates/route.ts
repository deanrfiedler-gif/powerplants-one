import { readRoute, commandRoute } from "../../../../../shared/http";
import { listEstimates } from "../../../../../estimating/reads";
import { createEstimate } from "../../../../../estimating/service";
export const GET=readRoute((p,_id,q)=>listEstimates(p,q));
export const POST=commandRoute((p,_id,b)=>createEstimate(p,b));
export const dynamic="force-dynamic";
