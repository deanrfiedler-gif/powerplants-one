import { readRoute } from "../../../../../../../shared/http";
import { accessReview } from "../../../../../../../access/reviews";
export const GET = readRoute((p, id) => accessReview(p, id));
