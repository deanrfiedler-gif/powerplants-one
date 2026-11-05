import { readRoute } from "../../../../../shared/http";
import { object } from "../../../../../shared/validation";
import { readBusinessPolicies } from "../../../../../admin/policies";
export const GET = readRoute((p,id,query) => { object(query, []); return readBusinessPolicies(p); });
