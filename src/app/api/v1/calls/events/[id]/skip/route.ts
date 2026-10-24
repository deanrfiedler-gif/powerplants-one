import { skipCallEvent } from "../../../../../../../calls/events";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(skipCallEvent, false);
