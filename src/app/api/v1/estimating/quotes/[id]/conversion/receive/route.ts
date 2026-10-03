import { commandRoute } from "../../../../../../../../shared/http";
import { receiveQuotation } from "../../../../../../../../estimating/conversion/service";
export const POST = commandRoute(receiveQuotation, false);
export const dynamic = "force-dynamic";
