import { commandRoute, readRoute } from "../../../../../../../shared/http";
import {
  commandClaims,
  readClaims,
} from "../../../../../../../projects/commercial/claims";
export const runtime = "nodejs";
export const GET = readRoute(readClaims);
export const POST = commandRoute(commandClaims, true, 196608);
