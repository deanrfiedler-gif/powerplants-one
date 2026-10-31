import { commandRoute } from "../../../../../../../shared/http";
import { publishRuleSet } from "../../../../../../../cpq/rule-set-store";
export const POST = commandRoute(publishRuleSet);
