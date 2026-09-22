import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { saveScope } from "../../../../../../../estimating/fertigation/service";
export const POST = fertigationPost(saveScope, true);
