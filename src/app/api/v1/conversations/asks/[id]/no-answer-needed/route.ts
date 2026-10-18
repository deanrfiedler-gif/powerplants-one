import { closeAsk } from "../../../../../../../conversations/commands";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => closeAsk(p, id, b), false);
