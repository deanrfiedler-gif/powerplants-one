import { readRoute } from "../../../../shared/http";
import { listMyJobs } from "../../../../field/reads";
export const GET = readRoute((p,_id,q)=>listMyJobs(p,q));
