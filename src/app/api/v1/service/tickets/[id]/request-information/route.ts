import { requestInformation } from "../../../../../../../service/intake";
import { commandRoute } from "../../../../../../../shared/http";
export const POST = commandRoute(
  (p, id, b) => requestInformation(p, id, b),
  false,
);
