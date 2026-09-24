import { readRoute, commandRoute } from "../../../../../../shared/http";
import { readFieldReadiness, acknowledgeFieldReadiness } from "../../../../../../field/readiness";
export const GET = readRoute(readFieldReadiness);
export const POST = commandRoute(acknowledgeFieldReadiness);
