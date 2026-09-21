import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { applyReceiving } from "../../../../../../../estimating/specialist/receiving";
export const dynamic = "force-dynamic";
export const POST = specialistPost(applyReceiving, true);
