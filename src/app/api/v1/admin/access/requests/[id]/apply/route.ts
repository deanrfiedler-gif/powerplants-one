import { commandRoute } from "../../../../../../../../shared/http";
import { applyAccessRequest } from "../../../../../../../../access/requests";
export const POST = commandRoute((p, id, input) => applyAccessRequest(p, id, input));
