import { readRoute } from "../../../../../../../shared/http";
import { accessRequestContext } from "../../../../../../../access/requests";
export const GET = readRoute((p, _id, _input) => accessRequestContext(p));
