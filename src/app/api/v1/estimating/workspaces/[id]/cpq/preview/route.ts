import { readRoute } from "../../../../../../../../shared/http";
import { previewCalculation } from "../../../../../../../../cpq/runs";
import { evaluatePreview } from "../../../../../../../../cpq/runs";
import { previewRoute } from "../../../../../../../../cpq/preview-http";
export const GET = readRoute(previewCalculation);
export const POST = previewRoute(evaluatePreview);
