import { assistantRoute } from '../../../../../assistant/http';
import { prepareProposal, recentProposals } from '../../../../../assistant/service';
export const GET = assistantRoute(p => recentProposals(p));
export const POST = assistantRoute((p, _id, input) => prepareProposal(p, input), true);
