import { previewRoute } from "../../../../../cpq/preview-http";
import { validateDraft } from "../../../../../cpq/ui-reads";
export const POST = previewRoute((p, _id, v) => validateDraft(p, v));
