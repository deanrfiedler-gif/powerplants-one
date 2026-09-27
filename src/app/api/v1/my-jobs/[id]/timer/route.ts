import { readRoute, commandRoute } from "../../../../../../shared/http";
import { readTimer, commandTimer } from "../../../../../../field/timer";
export const GET = readRoute(readTimer);
export const POST = commandRoute(commandTimer);
