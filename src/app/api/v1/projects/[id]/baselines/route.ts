import { recordBaseline, readBaselines } from "../../../../../../projects/baselines";
import { commandRoute, readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(readBaselines);
export const POST = commandRoute(recordBaseline);
