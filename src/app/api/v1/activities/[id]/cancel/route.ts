import { activityCommand } from "../../../../../../activities/activities";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute(
  (p, id, b) => activityCommand(p, id, b, "cancel"),
  false,
);
