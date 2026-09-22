import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { prepareOutput } from "../../../../../../../estimating/fertigation/artifacts";
export const POST = fertigationPost(prepareOutput, true);
