import { readRoute } from "../../../../../shared/http";
import { listQuotations } from "../../../../../estimating/quotations/reads";
export const GET = readRoute((p, _id, query) => listQuotations(p, query));
export const dynamic = "force-dynamic";
