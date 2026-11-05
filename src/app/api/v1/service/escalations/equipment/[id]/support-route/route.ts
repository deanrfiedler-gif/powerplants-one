import { commandRoute } from "../../../../../../../../shared/http";
import { recordSupportRoute } from "../../../../../../../../service/escalations/commands";
export const POST = commandRoute(recordSupportRoute, false);
