import { readRoute } from "../../../../../../../shared/http";
import { listDiscoveryHistory } from "../../../../../../../estimating/discovery-reads";
export const GET = readRoute(listDiscoveryHistory);
export const dynamic = "force-dynamic";
