import { commandRoute, readRoute } from "../../../../../../shared/http";
import { accessRequests, submitAccessRequest } from "../../../../../../access/requests";
export const GET = readRoute((p, _id, query) => accessRequests(p, query));
export const POST = commandRoute((p, _id, input) => submitAccessRequest(p, input));
