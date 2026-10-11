import { readRoute } from "../../../../../../../../shared/http";
import { accessRequestReceipt } from "../../../../../../../../access/requests";
export const GET = readRoute((p, id, _input) => accessRequestReceipt(p, id));
