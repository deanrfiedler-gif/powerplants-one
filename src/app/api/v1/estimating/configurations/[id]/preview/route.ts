import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { previewConfiguration } from "../../../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const POST = specialistPost(previewConfiguration, false);
