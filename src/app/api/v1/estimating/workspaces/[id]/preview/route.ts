import { discoveryPreviewRoute } from "../../../../../../../estimating/discovery-http";
import { previewDiscoveryChange } from "../../../../../../../estimating/discovery-workspaces";
export const POST = discoveryPreviewRoute(previewDiscoveryChange);
export const dynamic = "force-dynamic";
