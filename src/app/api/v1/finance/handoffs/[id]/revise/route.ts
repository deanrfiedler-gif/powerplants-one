import { financeRoute } from "../../../../../../../finance/http";
import { saveFinance } from "../../../../../../../finance/service";
export const POST = financeRoute(saveFinance, true, false);
