import { previewRoute } from "../../../../../../cpq/preview-http";
import { previewPackages } from "../../../../../../cpq/package-bindings";
export const POST = previewRoute((p, _id, v) => previewPackages(p, v), 200000);
