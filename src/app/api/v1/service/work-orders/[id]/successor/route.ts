import { saveWorkScope } from "../../../../../../../service/work-orders";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(
  (p, id, input) => saveWorkScope(p, id, input, true),
  false,
);
