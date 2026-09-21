import { readRoute } from "../../../../../../shared/http";
import { readConfiguration } from "../../../../../../estimating/specialist/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute(readConfiguration);
