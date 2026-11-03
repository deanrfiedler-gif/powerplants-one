import { libraryOptions } from "../../../../../library/options";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, query) => libraryOptions(p, query));
