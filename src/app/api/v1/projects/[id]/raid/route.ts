import { readRoute, commandRoute } from "../../../../../../shared/http";
import { readRaid, saveRaid } from "../../../../../../projects/raid";
export const runtime = "nodejs";
export const GET = readRoute(readRaid);
export const POST = commandRoute(saveRaid);
