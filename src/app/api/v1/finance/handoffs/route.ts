import { financeRoute } from "../../../../../finance/http";
import { listFinance } from "../../../../../finance/reads";
import { saveFinance } from "../../../../../finance/service";
export const GET = financeRoute((p, _id, q) => listFinance(p, q), false, false);
export const POST = financeRoute((p, _id, v) => saveFinance(p, null, v), true, false);
