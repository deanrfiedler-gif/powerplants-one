import { commandRoute, readRoute } from "../../../../../../../shared/http";
import {
  readCustomerDelivery,
  recordCustomerDelivery,
} from "../../../../../../../supply/customer-delivery";
export const GET = readRoute(readCustomerDelivery);
export const POST = commandRoute(recordCustomerDelivery);
