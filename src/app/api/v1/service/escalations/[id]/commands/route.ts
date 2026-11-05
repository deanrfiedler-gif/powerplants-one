import { commandRoute } from "../../../../../../../shared/http";
import { commandCase } from "../../../../../../../service/escalations/commands";
export const POST = commandRoute(commandCase, false, 15000000);
