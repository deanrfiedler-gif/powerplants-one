import { financeRoute } from "../../../../../../../finance/http";
import { observeAccount } from "../../../../../../../finance/accounts";
export const POST = financeRoute(observeAccount, true, false);
