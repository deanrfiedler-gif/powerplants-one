import { readProjectSchedule } from "../../../../../service/project-field-work";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
// B1: the schedule read plus the project's field work (filtered by the reader's work-order read).
export const GET = readRoute((p, id, q) => readProjectSchedule(p, id, q));
