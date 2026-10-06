import { commandRoute } from "../../../../../../../../shared/http";
import { proposeReceipt } from "../../../../../../../../estimating/supply-followup/receipt-service";
export const POST = commandRoute(proposeReceipt, false);
export const dynamic = "force-dynamic";
