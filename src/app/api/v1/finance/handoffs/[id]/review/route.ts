import { financeRoute } from "../../../../../../../finance/http";
import { reviewFinance } from "../../../../../../../finance/service";
export const POST = financeRoute(reviewFinance, true, false);
