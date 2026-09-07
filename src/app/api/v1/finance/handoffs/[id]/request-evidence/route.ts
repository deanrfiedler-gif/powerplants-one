import { financeRoute } from "../../../../../../../finance/http";
import { requestFinanceEvidence } from "../../../../../../../finance/worker";
export const POST = financeRoute(requestFinanceEvidence, true, false);
