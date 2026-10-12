import { readRoute } from "../../../../../../../../shared/http";
import { recoverAccessReview } from "../../../../../../../../access/reviews";
export const GET = readRoute((p, id) => recoverAccessReview(p, id));
