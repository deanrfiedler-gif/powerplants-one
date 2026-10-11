import { readRoute } from "../../../../../../../shared/http";
import { compareAccessRole } from "../../../../../../../access/service";
export const GET = readRoute((p, id, query) => compareAccessRole(p, id, query));
