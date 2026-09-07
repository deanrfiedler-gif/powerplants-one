import { financeRoute } from "../../../../../../../finance/http";
import { retryFinanceJob } from "../../../../../../../finance/worker";
export const POST = financeRoute(retryFinanceJob, true, false);
