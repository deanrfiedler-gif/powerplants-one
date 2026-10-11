import { readRoute } from "../../../../../../../shared/http";
import { accessRequest } from "../../../../../../../access/requests";
export const GET = readRoute((p, id, _input) => accessRequest(p, id));
