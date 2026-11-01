import { readRoute } from "../../../../../../shared/http";
import { readReviewSnapshot } from "../../../../../../estimating/review/queue-snapshot";
export const GET = readRoute((p, _id, query) => readReviewSnapshot(p, query));
export const dynamic = "force-dynamic";
