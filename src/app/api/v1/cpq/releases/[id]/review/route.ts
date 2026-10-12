import { commandRoute } from "../../../../../../../shared/http";
import { reviewRelease } from "../../../../../../../cpq/releases";
export const POST = commandRoute(reviewRelease);
