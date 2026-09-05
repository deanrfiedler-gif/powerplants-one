import { readAppointment } from "../../../../../scheduling/planner";
import { readRoute } from "../../../../../shared/http";
export const GET = readRoute(readAppointment);
