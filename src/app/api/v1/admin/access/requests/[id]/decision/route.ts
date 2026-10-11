import { commandRoute } from "../../../../../../../../shared/http";
import { decideAccessRequest } from "../../../../../../../../access/requests";
export const POST = commandRoute((p, id, input) => decideAccessRequest(p, id, input));
