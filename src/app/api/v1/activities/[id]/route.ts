import { readActivity } from "../../../../../activities/activities";
import { readRoute } from "../../../../../shared/http";
import { envelope } from "../../../../../shared/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id) =>
  envelope([await readActivity(p, id)]),
);
