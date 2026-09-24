import { readRoute } from "../../../../shared/http";
import { equipmentRegister } from "../../../../equipment/reads";
export const GET = readRoute((p, _id, query) => equipmentRegister(p, query));
