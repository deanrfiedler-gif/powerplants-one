import { readWorkOrderRegister } from "../../../../../../service/work-order-register";
import { readRoute } from "../../../../../../shared/http";
export const GET = readRoute((p, _id, q) => readWorkOrderRegister(p, q));
