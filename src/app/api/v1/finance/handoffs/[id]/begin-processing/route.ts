import { financeRoute } from "../../../../../../../finance/http";
import { beginFinanceProcessing } from "../../../../../../../finance/service";
export const POST = financeRoute(beginFinanceProcessing, true, false);
