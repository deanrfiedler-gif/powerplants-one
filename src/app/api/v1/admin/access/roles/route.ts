import { readRoute } from "../../../../../../shared/http";
import { accessRoles } from "../../../../../../access/service";
export const GET = readRoute((p) => accessRoles(p));
