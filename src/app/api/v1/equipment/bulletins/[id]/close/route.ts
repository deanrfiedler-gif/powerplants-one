import { commandRoute } from "../../../../../../../shared/http";
import { closeBulletin } from "../../../../../../../equipment/evidence";
export const POST = commandRoute((p, id, b) => closeBulletin(p, id, b));
