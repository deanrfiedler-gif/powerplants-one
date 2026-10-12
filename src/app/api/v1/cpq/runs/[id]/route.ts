import { readRoute } from "../../../../../../shared/http";
import { object } from "../../../../../../shared/validation";
import { readRun } from "../../../../../../cpq/reads";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return readRun(p, id);
});
