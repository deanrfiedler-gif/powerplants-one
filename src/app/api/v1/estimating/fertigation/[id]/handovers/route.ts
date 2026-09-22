import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { prepareHandover } from "../../../../../../../estimating/fertigation/review";
export const POST = fertigationPost(prepareHandover, true);
