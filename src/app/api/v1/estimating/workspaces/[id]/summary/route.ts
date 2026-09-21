import { readRoute } from "../../../../../../../shared/http";
import { readDiscoverySummary } from "../../../../../../../estimating/discovery-reads";
export const GET = readRoute(readDiscoverySummary);
export const dynamic = "force-dynamic";
