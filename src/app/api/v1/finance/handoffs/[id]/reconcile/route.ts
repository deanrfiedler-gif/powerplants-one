import { financeRoute } from "../../../../../../../finance/http";
import { reconcileFinance } from "../../../../../../../finance/service";
export const POST = financeRoute(reconcileFinance, true, false);
