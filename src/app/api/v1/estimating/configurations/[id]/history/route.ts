import { readRoute } from "../../../../../../../shared/http";
import { readHistory } from "../../../../../../../estimating/specialist/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(readHistory);
