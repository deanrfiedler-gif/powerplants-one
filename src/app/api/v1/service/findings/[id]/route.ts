import { readFinding } from "../../../../../../service/findings/reads";
import { readRoute } from "../../../../../../shared/http";
export const GET = readRoute((p, id, query) => readFinding(p, id, query));
