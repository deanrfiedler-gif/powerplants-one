import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { resolveOriginal } from "../../../../../../../estimating/specialist/recovery";
export const dynamic = "force-dynamic";
export const POST = specialistPost(resolveOriginal, true);
