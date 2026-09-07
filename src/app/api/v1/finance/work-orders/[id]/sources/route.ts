import { financeRoute } from "../../../../../../../finance/http";
import { financeSources } from "../../../../../../../finance/reads";
export const GET = financeRoute(financeSources, false, false);
