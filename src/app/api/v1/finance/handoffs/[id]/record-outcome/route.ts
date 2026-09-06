import { financeRoute } from "../../../../../../../finance/http";
import { recordFinanceOutcome } from "../../../../../../../finance/service";
export const POST = financeRoute(recordFinanceOutcome, true, false);
