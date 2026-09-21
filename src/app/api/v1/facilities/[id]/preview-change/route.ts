import { previewChange } from "../../../../../../shared/facilities/commands";
import { previewRoute } from "../../../../../../shared/facilities/http";
export const dynamic = "force-dynamic";
export const POST = previewRoute((p, id, b) => previewChange(p, id, b));
