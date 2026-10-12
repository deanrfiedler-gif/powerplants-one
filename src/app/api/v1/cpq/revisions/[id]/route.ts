import { readRoute } from "../../../../../../shared/http";
import { object } from "../../../../../../shared/validation";
import { readRevision } from "../../../../../../cpq/reads";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return readRevision(p, id);
});
