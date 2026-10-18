import { resolveThread } from "../../../../../../conversations/commands";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => resolveThread(p, id, b), false);
