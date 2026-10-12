import { readRoute } from "../../../../../../shared/http";
import { readQuotation } from "../../../../../../estimating/quotations/reads";
export const GET = readRoute(readQuotation);
export const dynamic = "force-dynamic";
