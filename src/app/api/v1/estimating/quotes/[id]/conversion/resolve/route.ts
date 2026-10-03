import { commandRoute } from "../../../../../../../../shared/http";
import { resolveQuotationItem } from "../../../../../../../../estimating/conversion/service";
export const POST = commandRoute(resolveQuotationItem, false);
export const dynamic = "force-dynamic";
