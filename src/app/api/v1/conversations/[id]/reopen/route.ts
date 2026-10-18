import { reopenThread } from "../../../../../../conversations/commands";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => reopenThread(p, id, b), false);
