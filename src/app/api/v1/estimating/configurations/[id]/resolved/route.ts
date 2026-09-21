import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { adjustResolved } from "../../../../../../../estimating/specialist/service";
export const dynamic = "force-dynamic";
export const POST = specialistPost(adjustResolved, true);
