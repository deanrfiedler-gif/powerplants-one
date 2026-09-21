import { discoveryPreviewRoute } from "../../../../../../../estimating/discovery-http";
import { compareDiscoverySources } from "../../../../../../../estimating/discovery-reads";
export const POST = discoveryPreviewRoute(compareDiscoverySources);
export const dynamic = "force-dynamic";
