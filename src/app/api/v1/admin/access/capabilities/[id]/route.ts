import { readRoute } from "../../../../../../../shared/http";
import { accessCapability } from "../../../../../../../access/service";
export const GET = readRoute((p, id, query) => accessCapability(p, id!, query));
