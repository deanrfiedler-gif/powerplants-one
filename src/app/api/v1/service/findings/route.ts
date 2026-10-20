import { readFindings } from "../../../../../service/findings/reads";
import { readRoute } from "../../../../../shared/http";
export const GET = readRoute((p, _id, query) => readFindings(p, query));
