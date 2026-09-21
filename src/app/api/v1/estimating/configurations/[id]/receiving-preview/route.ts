import { specialistPost } from "../../../../../../../estimating/specialist/http";
import { previewReceiving } from "../../../../../../../estimating/specialist/receiving";
export const dynamic = "force-dynamic";
export const POST = specialistPost(previewReceiving, false);
