import { commandRoute } from "../../../../../../../shared/http";
import { recordFact } from "../../../../../../../supply/commands";
export const POST = commandRoute(recordFact);
