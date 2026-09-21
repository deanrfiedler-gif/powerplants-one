import { previewPin } from "../../../../../../shared/facilities/commands";
import { previewRoute } from "../../../../../../shared/facilities/http";
export const dynamic = "force-dynamic";
export const POST = previewRoute((p, id, b) => previewPin(p, id, b));
