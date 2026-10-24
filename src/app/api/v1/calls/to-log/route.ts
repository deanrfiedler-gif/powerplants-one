import { listCallsToLog } from "../../../../../calls/events";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p) => listCallsToLog(p));
