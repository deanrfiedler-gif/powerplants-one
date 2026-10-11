import { readRoute } from "../../../../../../shared/http";
import { accessCapabilities } from "../../../../../../access/service";
export const GET = readRoute((p, _id, query) => accessCapabilities(p, query));
