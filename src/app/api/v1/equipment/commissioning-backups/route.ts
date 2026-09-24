import { readRoute } from "../../../../../shared/http";
import { equipmentCommissioningBackups } from "../../../../../equipment/commissioning";
export const GET = readRoute((p, _id, q) =>
  equipmentCommissioningBackups(p, q),
);
