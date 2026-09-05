import { readWorkOrder } from "../../../../../../service/work-orders";
import { readRoute } from "../../../../../../shared/http";
export const GET = readRoute((p, id) => readWorkOrder(p, id));
