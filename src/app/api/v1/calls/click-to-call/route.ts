import { recordClickToCall } from "../../../../../calls/events";
import { commandRoute } from "../../../../../shared/http";
export const POST = commandRoute((p, _id, b) => recordClickToCall(p, b));
