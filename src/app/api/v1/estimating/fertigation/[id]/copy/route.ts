import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { copyScope } from "../../../../../../../estimating/fertigation/history";
export const POST = fertigationPost(copyScope, true);
