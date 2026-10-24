import { readRoute, commandRoute } from "../../../../../shared/http";
import { listRuleSets, saveRuleSet } from "../../../../../cpq/rule-set-store";
export const GET = readRoute((p, _id, q) => listRuleSets(p, q));
export const POST = commandRoute((p, _id, v) => saveRuleSet(p, v));
