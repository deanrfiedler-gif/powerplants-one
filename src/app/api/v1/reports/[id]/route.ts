import { readReport } from "../../../../../reports/service";
import { readRoute } from "../../../../../shared/http";
export const GET = readRoute(readReport);
