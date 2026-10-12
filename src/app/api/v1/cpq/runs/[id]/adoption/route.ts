import { readRoute, commandRoute } from "../../../../../../../shared/http";
import { object } from "../../../../../../../shared/validation";
import { previewAdoption, adoptRun } from "../../../../../../../cpq/runs";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return previewAdoption(p, id);
});
export const POST = commandRoute(adoptRun);
