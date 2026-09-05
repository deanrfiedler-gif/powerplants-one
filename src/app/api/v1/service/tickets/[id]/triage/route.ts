import { triageTicket } from "../../../../../../../service/intake";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => triageTicket(p, id, b), false);
