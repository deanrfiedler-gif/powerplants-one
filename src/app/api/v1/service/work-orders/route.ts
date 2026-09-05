import {
  listWorkOrders,
  createWorkOrder,
} from "../../../../../service/work-orders";
import { readRoute, commandRoute } from "../../../../../shared/http";
export const GET = readRoute((p, _id, q) => listWorkOrders(p, q));
export const POST = commandRoute((p, _id, input) => createWorkOrder(p, input));
