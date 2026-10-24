import { readRoute, commandRoute } from "../../../../../shared/http";
import { listRuleSets, saveRuleSet } from "../../../../../cpq/rule-set-store";
export const GET = readRoute((p, _id, q) => listRuleSets(p, q));
// A rule set may hold up to 524,288 bytes (LIMITS.bytes) plus the command envelope.
export const POST = commandRoute((p, _id, v) => saveRuleSet(p, v), true, 640000);
