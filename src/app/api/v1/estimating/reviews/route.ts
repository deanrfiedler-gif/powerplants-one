import { readRoute } from "../../../../../shared/http";
import { readEstimatingReviewQueue } from "../../../../../estimating/review/queue";

export const GET = readRoute((p, _id, query) =>
  readEstimatingReviewQueue(p, query),
);
export const dynamic = "force-dynamic";
