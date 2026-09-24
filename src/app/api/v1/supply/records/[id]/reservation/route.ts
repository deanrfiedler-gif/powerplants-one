import { commandRoute } from "../../../../../../../shared/http";
import { sourceReservation } from "../../../../../../../supply/commands";
export const POST = commandRoute((p, id) => sourceReservation(p, id));
