import { readRoute } from "../../../../../shared/http";
import { equipmentOptions } from "../../../../../equipment/options";
export const GET = readRoute((p, _id, q) => equipmentOptions(p, q));
