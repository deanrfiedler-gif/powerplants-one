import { readRoute } from "../../../../../shared/http";
import { receivingWorklist } from "../../../../../estimating/supply-followup/reads";
export const GET = readRoute((p, _id, query) => receivingWorklist(p, query));
export const dynamic = "force-dynamic";
