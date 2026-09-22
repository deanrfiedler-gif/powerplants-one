import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { archiveScope } from "../../../../../../../estimating/fertigation/service";
export const POST = fertigationPost(archiveScope, true);
