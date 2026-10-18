import { confirmCustomerMessage } from "../../../../../../communications";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => confirmCustomerMessage(p, id, b));
