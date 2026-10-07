import { resolveLeadContext } from "../../../../../../../crm/leads/amendments";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(resolveLeadContext, false);
