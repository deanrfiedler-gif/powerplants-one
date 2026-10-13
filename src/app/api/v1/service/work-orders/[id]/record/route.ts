import { readWorkOrderRecord } from "../../../../../../../service/work-order-register";
import { readRoute } from "../../../../../../../shared/http";
export const GET = readRoute((p, id, q) => readWorkOrderRecord(p, id, q));
