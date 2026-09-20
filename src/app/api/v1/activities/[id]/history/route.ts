import { activityHistory } from "../../../../../../activities/activities";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => activityHistory(p, id));
