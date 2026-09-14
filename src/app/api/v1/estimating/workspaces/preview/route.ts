import { discoveryPreviewRoute } from "../../../../../../estimating/discovery-http";
import { previewDiscoveryCreate } from "../../../../../../estimating/discovery-workspaces";
export const POST = discoveryPreviewRoute((p, _id, value) =>
  previewDiscoveryCreate(p, value),
);
export const dynamic = "force-dynamic";
