import { readChangeReview } from "../../../../../../scheduling/change-review";
import { readRoute } from "../../../../../../shared/http";
export const GET = readRoute((p, id) => readChangeReview(p, id!));
