import { postMessage } from "../../../../../../conversations/commands";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => postMessage(p, id, b));
