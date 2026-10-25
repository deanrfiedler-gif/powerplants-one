import { readRoute } from "../../../../../../shared/http";
import { readRuleSet } from "../../../../../../cpq/rule-set-store";
export const GET = readRoute((p, id, q) => readRuleSet(p, id, q));
