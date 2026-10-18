import { markRead } from "../../../../../../conversations/commands";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => markRead(p, id, b), false);
