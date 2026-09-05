import { confirmAppointment } from "../../../../../../scheduling/planner";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute(confirmAppointment, false);
