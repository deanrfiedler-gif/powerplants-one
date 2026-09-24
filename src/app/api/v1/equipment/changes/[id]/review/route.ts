import { commandRoute } from "../../../../../../../shared/http";
import { reviewEquipmentChange } from "../../../../../../../equipment/changes";
export const POST = commandRoute((p, id, b) => reviewEquipmentChange(p, id, b));
