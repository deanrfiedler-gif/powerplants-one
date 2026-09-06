import { listReports } from "../../../../reports/service";
import { readRoute } from "../../../../shared/http";
export const GET = readRoute((p, _id, q) => listReports(p, q));
