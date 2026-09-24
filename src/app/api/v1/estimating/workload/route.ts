import { readRoute } from "../../../../../shared/http";
import { readEstimatingWorkload } from "../../../../../estimating/workload";
export const GET = readRoute((p, _id, query) => readEstimatingWorkload(p, query));
export const dynamic = "force-dynamic";
