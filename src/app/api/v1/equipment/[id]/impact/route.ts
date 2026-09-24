import { readRoute } from "../../../../../../shared/http";
import { previewEquipmentChange } from "../../../../../../equipment/changes";
export const GET = readRoute((p, id) => previewEquipmentChange(p, id));
