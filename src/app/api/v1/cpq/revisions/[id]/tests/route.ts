import { readRoute } from "../../../../../../../shared/http";
import { object } from "../../../../../../../shared/validation";
import { testRelease } from "../../../../../../../cpq/releases";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return testRelease(p, id);
});
