import { recordOpportunityOutcome } from "../../../../../../../crm/outcomes";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(recordOpportunityOutcome, false);
