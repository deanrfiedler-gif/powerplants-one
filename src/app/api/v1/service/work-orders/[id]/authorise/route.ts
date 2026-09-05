import { authoriseWorkOrder } from "../../../../../../../service/work-orders";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(authoriseWorkOrder, false);
