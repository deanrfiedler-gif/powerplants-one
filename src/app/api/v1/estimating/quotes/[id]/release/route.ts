import { readRoute } from "../../../../../../../shared/http";
import { readRelease } from "../../../../../../../estimating/release/reads";
export const GET = readRoute(readRelease);
export const dynamic = "force-dynamic";
