import { financeRoute } from "../../../../../finance/http";
import { financeOptions } from "../../../../../finance/reads";
export const GET = financeRoute((p, _id, q) => financeOptions(p, q), false, false);
