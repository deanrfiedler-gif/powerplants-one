import { readRoute } from "../../../../../../shared/http";
import { readProjectOverview } from "../../../../../../projects/overview";
export const runtime = "nodejs";
export const GET = readRoute(readProjectOverview);
