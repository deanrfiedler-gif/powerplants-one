import { assistantRoute } from '../../../../../../../assistant/http';
import { confirmProposal } from '../../../../../../../assistant/service';
export const POST = assistantRoute(confirmProposal, true);
