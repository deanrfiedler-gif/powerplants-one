import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { archiveConfiguration } from "../../../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const POST = specialistPost(archiveConfiguration, true);
