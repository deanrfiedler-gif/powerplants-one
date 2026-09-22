import { fertigationPost } from "../../../../../../../../estimating/fertigation/http";
import { acceptHandover } from "../../../../../../../../estimating/fertigation/review";
export const POST = fertigationPost(acceptHandover, true);
