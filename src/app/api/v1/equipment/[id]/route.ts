import { readRoute } from "../../../../../shared/http";
import { equipmentWorkspace } from "../../../../../equipment/reads";
export const GET = readRoute((p, id) => equipmentWorkspace(p, id));
