import { proposalHistory } from "../../../../../../documents/drafts/reads";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(proposalHistory);
