import { discoveryPreviewRoute } from "../../../../../../../../estimating/discovery-http";
import { previewSourceRefresh } from "../../../../../../../../estimating/sources/refresh";
export const POST=discoveryPreviewRoute(previewSourceRefresh);
export const dynamic="force-dynamic";
