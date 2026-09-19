import { readUnassignedDemand } from "../../../../../scheduling/demand";
import { readRoute } from "../../../../../shared/http";
export const GET = readRoute((p, _id, q) => readUnassignedDemand(p, q));
