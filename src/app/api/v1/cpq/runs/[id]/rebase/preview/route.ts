import { previewRoute } from "../../../../../../../../cpq/preview-http";
import { previewRebase } from "../../../../../../../../cpq/rebase";
import {
  decisionBodyBytes,
  decisionJsonBody,
} from "../../../../../../../../cpq/http-limits";
export const POST = previewRoute(
  previewRebase,
  decisionBodyBytes,
  decisionJsonBody,
);
