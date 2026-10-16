import { commandRoute, readRoute } from "../../../../../../shared/http";
import {
  commandWork,
  readWork,
} from "../../../../../../projects/specialist/work/service";
export const runtime = "nodejs";
export const GET = readRoute(readWork);
export const POST = commandRoute(commandWork);
