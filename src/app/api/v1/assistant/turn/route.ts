import { assistantRoute } from '../../../../../assistant/http';
import { assistantTurn } from '../../../../../assistant/service';
export const POST = assistantRoute((p, _id, input) => assistantTurn(p, input), true);
