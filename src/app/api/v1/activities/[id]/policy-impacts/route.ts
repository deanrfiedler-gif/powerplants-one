import { readRoute } from "../../../../../../shared/http";
import { readPolicyHolds } from "../../../../../../scheduling/policy-hold-reads";
export const GET = readRoute(readPolicyHolds);
