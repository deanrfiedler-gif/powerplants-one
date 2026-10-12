import { commandRoute } from "../../../../../../../shared/http";
import { activateRelease } from "../../../../../../../cpq/releases";
export const POST = commandRoute(activateRelease);
