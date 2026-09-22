import { applicationSearch } from "../../../../shell/search-service";
import { readRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, query) => applicationSearch(p, query));
