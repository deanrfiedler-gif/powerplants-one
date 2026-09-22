import { readRoute } from "../../../../../shared/http";
import { listScopes } from "../../../../../estimating/fertigation/reads";
import { createScope } from "../../../../../estimating/fertigation/service";
import { fertigationPost } from "../../../../../estimating/fertigation/http";
export const GET = readRoute((p, _id, q) => listScopes(p, q));
export const POST = fertigationPost((p, _id, v) => createScope(p, v), true);
