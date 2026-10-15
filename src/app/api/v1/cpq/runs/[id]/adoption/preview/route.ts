import { previewRoute } from "../../../../../../../../cpq/preview-http";
import { previewAdoption } from "../../../../../../../../cpq/runs";
import {
  decisionBodyBytes,
  decisionJsonBody,
} from "../../../../../../../../cpq/http-limits";
export const POST = previewRoute(
  previewAdoption,
  decisionBodyBytes,
  decisionJsonBody,
);
