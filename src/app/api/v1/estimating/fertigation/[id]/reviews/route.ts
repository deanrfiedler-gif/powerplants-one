import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { recordReview } from "../../../../../../../estimating/fertigation/review";
export const POST = fertigationPost(recordReview, true);
