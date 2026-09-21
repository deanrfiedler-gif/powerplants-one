import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { copyConfiguration } from "../../../../../../../estimating/specialist/source";
export const dynamic = "force-dynamic";
export const POST = specialistPost(copyConfiguration, true);
