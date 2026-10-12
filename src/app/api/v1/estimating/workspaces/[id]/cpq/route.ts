import { readRoute, commandRoute } from "../../../../../../../shared/http";
import { object } from "../../../../../../../shared/validation";
import { runHistory } from "../../../../../../../cpq/reads";
import { calculateRun } from "../../../../../../../cpq/runs";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return runHistory(p, id);
});
export const POST = commandRoute(calculateRun);
