import { listActivities } from "../../../../activities/activities";
import { readRoute, commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listActivities(p, q));
import { createActivity } from "../../../../activities/activities";
export const POST = commandRoute((p, _id, b) => createActivity(p, b));
