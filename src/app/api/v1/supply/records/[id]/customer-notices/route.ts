import { commandRoute } from "../../../../../../../shared/http";
import { prepareSupplyCustomerNotice } from "../../../../../../../supply/customer-delivery";
export const POST = commandRoute(prepareSupplyCustomerNotice);
