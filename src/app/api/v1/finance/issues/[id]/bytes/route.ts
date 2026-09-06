import { financeRoute } from "../../../../../../../finance/http";
import { financeIssueBytes } from "../../../../../../../finance/worker";
export const GET = financeRoute(financeIssueBytes, false, true);
