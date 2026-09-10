import { readRoute } from "../../../../../shared/http";
import { shellContext } from "../../../../../shell/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, query) => shellContext(p, query));
