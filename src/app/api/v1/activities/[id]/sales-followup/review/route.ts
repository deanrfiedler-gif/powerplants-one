import { commandRoute } from "../../../../../../../shared/http";
import { createSalesReview } from "../../../../../../../sales/followup";
export const POST = commandRoute((p, id, v) => createSalesReview(p, id!, v));
