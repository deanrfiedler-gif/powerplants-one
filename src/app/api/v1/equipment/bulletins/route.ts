import { readRoute, commandRoute } from "../../../../../shared/http";
import {
  equipmentEvidence,
  createEquipmentEvidence,
} from "../../../../../equipment/evidence";
export const GET = readRoute((p, _id, q) =>
  equipmentEvidence(p, "bulletins", q),
);
export const POST = commandRoute((p, _id, b) =>
  createEquipmentEvidence(p, "bulletins", b),
);
