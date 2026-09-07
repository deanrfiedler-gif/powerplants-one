import { financeRoute } from "../../../../../../finance/http";
import { readAccount } from "../../../../../../finance/accounts";
export const GET = financeRoute(readAccount, false, false);
