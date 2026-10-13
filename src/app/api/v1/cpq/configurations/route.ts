import { readRoute } from "../../../../../shared/http";
import { configurationRegister } from "../../../../../cpq/ui-reads";
export const GET = readRoute((p, _id, q) => configurationRegister(p, q));
