import { cancelAppointment } from "../../../../../../scheduling/planner";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute(cancelAppointment, false);
