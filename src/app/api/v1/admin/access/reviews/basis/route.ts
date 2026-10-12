import { readRoute } from "../../../../../../../shared/http";
import { accessReviewBasis } from "../../../../../../../access/reviews";
export const GET = readRoute((p, _id, query) => accessReviewBasis(p, query));
