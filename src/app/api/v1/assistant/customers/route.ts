import { assistantRoute } from '../../../../../assistant/http';
import { searchCustomers } from '../../../../../assistant/service';
export const GET = assistantRoute((p, _id, input) => searchCustomers(p, input));
