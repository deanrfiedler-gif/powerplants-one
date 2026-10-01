import { readRoute } from "../../../../../shared/http";
import { readPolicyRecords } from "../../../../../scheduling/policy-records";
export const GET = readRoute((p, _id, query) => readPolicyRecords(p, query));
