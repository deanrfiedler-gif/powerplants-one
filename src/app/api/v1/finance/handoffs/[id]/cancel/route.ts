import { financeRoute } from "../../../../../../../finance/http";
import { cancelFinance } from "../../../../../../../finance/service";
export const POST = financeRoute(cancelFinance, true, false);
