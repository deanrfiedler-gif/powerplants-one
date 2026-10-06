import { commandRoute } from "../../../../../../../../shared/http";
import { decideEstimateReview } from "../../../../../../../../estimating/review/service";
export const POST=commandRoute(decideEstimateReview,false);
export const dynamic="force-dynamic";
