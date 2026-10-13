import { readRoute } from "../../../../../../../shared/http";
import { compareRevisions } from "../../../../../../../cpq/reads";
export const GET = readRoute((p, id, q) => compareRevisions(p, id, q));
