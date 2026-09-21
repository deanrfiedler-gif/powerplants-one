import { readRoute } from "../../../../../../../shared/http";
import { listDiscoveryCostVersions } from "../../../../../../../estimating/discovery-reads";
export const GET = readRoute(listDiscoveryCostVersions);
export const dynamic = "force-dynamic";
