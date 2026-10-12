import { readRoute } from "../../../../../../shared/http";
import { object } from "../../../../../../shared/validation";
import { readRelease } from "../../../../../../cpq/reads";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return readRelease(p, id);
});
