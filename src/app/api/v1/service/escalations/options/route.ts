import { readRoute } from "../../../../../../shared/http";
import { caseOptions } from "../../../../../../service/escalations/reads";
export const GET = readRoute((p, _id, q) => caseOptions(p, q));
