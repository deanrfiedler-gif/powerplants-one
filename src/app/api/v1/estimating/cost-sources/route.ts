import { readRoute,commandRoute } from "../../../../../shared/http";
import { listCostSources } from "../../../../../estimating/sources/reads";
import { createCostSource } from "../../../../../estimating/sources/commands";
export const GET=readRoute((p,_id,q)=>listCostSources(p,q));
export const POST=commandRoute((p,_id,b)=>createCostSource(p,b));
export const dynamic="force-dynamic";
