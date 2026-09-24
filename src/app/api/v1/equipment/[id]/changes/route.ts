import { readRoute, commandRoute } from "../../../../../../shared/http";
import {
  equipmentChanges,
  proposeEquipmentChange,
} from "../../../../../../equipment/changes";
export const GET = readRoute((p, id) => equipmentChanges(p, id));
export const POST = commandRoute((p, id, b) =>
  proposeEquipmentChange(p, id, b),
);
