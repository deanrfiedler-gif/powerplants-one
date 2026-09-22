import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { compareRevisions } from "../../../../../../../estimating/fertigation/history";
export const POST = fertigationPost(compareRevisions, false);
