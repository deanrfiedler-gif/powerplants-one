import { readRoute } from "../../../../../shared/http";
import { ruleRegister } from "../../../../../cpq/ui-reads";
export const GET = readRoute((p, _id, q) => ruleRegister(p, q));
