import { publishCustomerEmailTemplate } from "../../../../../../../communications";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute((p, id, b) => publishCustomerEmailTemplate(p, id, b));
