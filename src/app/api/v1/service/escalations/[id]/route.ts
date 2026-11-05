import { readRoute } from "../../../../../../shared/http";
import { readCase } from "../../../../../../service/escalations/reads";
export const GET = readRoute(readCase);
