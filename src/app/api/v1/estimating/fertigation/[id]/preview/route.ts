import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { previewScope } from "../../../../../../../estimating/fertigation/service";
export const POST = fertigationPost(previewScope, false);
