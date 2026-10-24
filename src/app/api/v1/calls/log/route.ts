import { logCall } from "../../../../../calls/log-call";
import { commandRoute } from "../../../../../shared/http";
export const POST = commandRoute((p, _id, b) => logCall(p, b));
