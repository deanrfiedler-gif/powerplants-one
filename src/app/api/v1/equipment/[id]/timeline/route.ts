import { readRoute } from "../../../../../../shared/http";
import { equipmentTimeline } from "../../../../../../equipment/timeline";
export const GET = readRoute((p, id) => equipmentTimeline(p, id));
