import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { saveRun } from "../../../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const POST = specialistPost(saveRun, true);
