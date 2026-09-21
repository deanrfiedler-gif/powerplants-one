import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { draftFromRun } from "../../../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const POST = specialistPost(draftFromRun, true);
