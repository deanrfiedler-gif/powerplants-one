import { reviewProposal } from "../../../../../../documents/drafts/commands";
import { commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute(reviewProposal);
