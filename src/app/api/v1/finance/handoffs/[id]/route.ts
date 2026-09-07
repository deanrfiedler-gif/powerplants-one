import { financeRoute } from "../../../../../../finance/http";
import { readFinance } from "../../../../../../finance/reads";
export const GET = financeRoute(readFinance, false, false);
