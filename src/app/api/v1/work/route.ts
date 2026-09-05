import { listActivities } from "../../../../activities/activities";
import { readRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listActivities(p, q));
