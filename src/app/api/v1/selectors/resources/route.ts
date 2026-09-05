import { listResources } from "../../../../../scheduling/planner";
import { readRoute } from "../../../../../shared/http";
export const GET = readRoute((p, _id, q) => listResources(p, q));
