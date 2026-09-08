import { assistantRoute } from '../../../../../../assistant/http';
import { readProposal } from '../../../../../../assistant/service';
export const GET = assistantRoute(readProposal);
