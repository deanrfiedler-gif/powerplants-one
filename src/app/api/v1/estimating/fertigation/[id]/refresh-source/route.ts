import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { refreshSource } from "../../../../../../../estimating/fertigation/service";
export const POST = fertigationPost(refreshSource, true);
