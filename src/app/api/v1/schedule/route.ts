import { readSchedule } from "../../../../scheduling/planner";
import { readRoute } from "../../../../shared/http";
export const GET = readRoute((p, _id, q) => readSchedule(p, q));
