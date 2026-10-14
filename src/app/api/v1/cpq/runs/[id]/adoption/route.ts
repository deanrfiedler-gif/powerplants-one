import { readRoute, commandRoute } from "../../../../../../../shared/http";
import { object } from "../../../../../../../shared/validation";
import { previewAdoption, adoptRun } from "../../../../../../../cpq/runs";
import { decisionBodyBytes } from "../../../../../../../cpq/http-limits";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return previewAdoption(p, id);
});
export const POST = commandRoute(adoptRun, true, decisionBodyBytes);
