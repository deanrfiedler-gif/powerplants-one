import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { saveDraft } from "../../../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const POST = specialistPost(saveDraft, true);
