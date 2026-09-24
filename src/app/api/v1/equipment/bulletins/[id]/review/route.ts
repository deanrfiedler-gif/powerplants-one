import { commandRoute } from "../../../../../../../shared/http";
import { reviewBulletin } from "../../../../../../../equipment/evidence";
export const POST = commandRoute((p, id, b) => reviewBulletin(p, id, b));
