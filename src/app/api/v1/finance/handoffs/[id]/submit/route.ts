import { financeRoute } from "../../../../../../../finance/http";
import { submitFinance } from "../../../../../../../finance/service";
export const POST = financeRoute(submitFinance, true, false);
