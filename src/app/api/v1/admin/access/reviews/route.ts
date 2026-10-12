import { readRoute, commandRoute } from "../../../../../../shared/http";
import {
  accessReviews,
  recordAccessReview,
} from "../../../../../../access/reviews";
export const GET = readRoute((p, _id, query) => accessReviews(p, query));
export const POST = commandRoute((p, _id, input) =>
  recordAccessReview(p, input),
);
