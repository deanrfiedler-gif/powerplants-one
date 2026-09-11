import { readRoute } from "../../../../../shared/http";
import { shellSearch } from "../../../../../shell/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, query) => shellSearch(p, query));
