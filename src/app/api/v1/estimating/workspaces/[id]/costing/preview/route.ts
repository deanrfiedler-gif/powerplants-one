import { discoveryPreviewRoute } from "../../../../../../../../estimating/discovery-http";
import { previewDiscoveryCosting } from "../../../../../../../../estimating/cost-basis-service";
export const POST=discoveryPreviewRoute(previewDiscoveryCosting);
export const dynamic="force-dynamic";
