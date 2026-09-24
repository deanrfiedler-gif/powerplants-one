import { readRoute } from "../../../../../shared/http";
import { equipmentLookup } from "../../../../../equipment/reads";
export const GET = readRoute((p, _id, query) => equipmentLookup(p, query));
