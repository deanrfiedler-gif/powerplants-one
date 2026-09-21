import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { rebaseSource } from "../../../../../../../estimating/specialist/source";
export const dynamic = "force-dynamic";
export const POST = specialistPost(rebaseSource, true);
