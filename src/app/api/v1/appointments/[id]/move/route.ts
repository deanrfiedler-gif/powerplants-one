import { moveAppointment } from "../../../../../../scheduling/planner";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute(moveAppointment, false);
