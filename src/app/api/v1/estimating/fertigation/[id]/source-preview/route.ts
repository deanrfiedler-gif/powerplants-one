import { fertigationPost } from "../../../../../../../estimating/fertigation/http";
import { previewSource } from "../../../../../../../estimating/fertigation/service";
export const POST = fertigationPost(previewSource, false);
