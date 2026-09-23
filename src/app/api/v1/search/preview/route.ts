import { searchPreview } from "../../../../../shell/search-service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, query) => searchPreview(p, query));
