import { readRoute } from "../../../../../shared/http";
import { readPolicyHolds } from "../../../../../scheduling/policy-hold-reads";
export const GET = readRoute((p, _id, q) => readPolicyHolds(p, null, q));
