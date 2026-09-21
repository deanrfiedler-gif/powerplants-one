import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { recordFinding } from "../../../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const POST = specialistPost(recordFinding, true);
