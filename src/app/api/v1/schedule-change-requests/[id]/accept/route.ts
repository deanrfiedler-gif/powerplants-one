import { decideChangeRequest } from "../../../../../../scheduling/planner";
import { commandRoute } from "../../../../../../shared/http";
export const POST = commandRoute(
  (p, id, input) => decideChangeRequest(p, id, input, "accept"),
  false,
);
