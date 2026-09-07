import { financeRoute } from "../../../../../../../finance/http";
import { requestFinanceCorrection } from "../../../../../../../finance/service";
export const POST = financeRoute(requestFinanceCorrection, true, false);
