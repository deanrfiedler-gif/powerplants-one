import { reconcileCustomerMessage } from "../../../../../../communications";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => reconcileCustomerMessage(p, id, b));
