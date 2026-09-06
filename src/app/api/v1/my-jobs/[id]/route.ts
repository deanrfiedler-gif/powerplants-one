import { object } from "../../../../../shared/validation";
import { readRoute } from "../../../../../shared/http";
import { readFieldJob } from "../../../../../field/reads";
export const GET = readRoute((p,id,q)=>{object(q,[]);return readFieldJob(p,id);});
