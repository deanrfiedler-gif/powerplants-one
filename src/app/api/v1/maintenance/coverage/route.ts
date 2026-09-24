import { readRoute, commandRoute } from "../../../../../shared/http";
import { register } from "../../../../../maintenance/reads";
import { createAssessment } from "../../../../../maintenance/assessments";
export const GET = readRoute((p,_id,q)=>register(p,"coverage",q));
export const POST = commandRoute((p,_id,body)=>createAssessment(p,body));
