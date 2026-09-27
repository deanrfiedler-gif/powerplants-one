import { readRoute } from "../../../../../shared/http";
import { readPolicyImpact } from "../../../../../scheduling/policy-impact";
export const GET = readRoute((p, _id, q) => readPolicyImpact(p, q));
