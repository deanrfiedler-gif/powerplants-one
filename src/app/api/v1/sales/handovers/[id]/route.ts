import {
  readHandover,
  commandHandover,
} from "../../../../../../sales/handover-service";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(readHandover);
export const POST = commandRoute(commandHandover, false);
