import { readRoute, commandRoute } from "../../../../../../../shared/http";
import { readEstimateReview } from "../../../../../../../estimating/review/reads";
import { submitEstimateReview } from "../../../../../../../estimating/review/service";
export const GET=readRoute(readEstimateReview);
export const POST=commandRoute(submitEstimateReview,false);
export const dynamic="force-dynamic";
