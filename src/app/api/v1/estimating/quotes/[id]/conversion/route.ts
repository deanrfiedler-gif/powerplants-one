import { readRoute } from "../../../../../../../shared/http";
import { readConversion } from "../../../../../../../estimating/conversion/reads";
export const GET = readRoute(readConversion);
export const dynamic = "force-dynamic";
