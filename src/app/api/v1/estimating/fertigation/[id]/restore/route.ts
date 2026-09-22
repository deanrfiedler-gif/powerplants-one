import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { restoreRevision } from "../../../../../../../estimating/fertigation/history";
export const POST = fertigationPost(restoreRevision, true);
