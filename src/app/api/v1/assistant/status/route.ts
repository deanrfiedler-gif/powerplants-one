import { assistantRoute } from '../../../../../assistant/http';
import { assistantMode } from '../../../../../assistant/config';
import { ASSISTANT_LABEL } from '../../../../../assistant/simulated';
export const GET = assistantRoute(async () => ({ mode: assistantMode(), label: ASSISTANT_LABEL }));
