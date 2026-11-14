import { readRoute } from "../../../../../../shared/http";
import { readProjectReadiness } from "../../../../../../projects/readiness/reads";
export const runtime = "nodejs";
export const GET = readRoute(readProjectReadiness);
