import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { resolveOriginal } from "../../../../../../../estimating/fertigation/recovery";
export const POST = fertigationPost(resolveOriginal, true);
