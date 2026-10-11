import { commandRoute } from "../../../../../../../../shared/http";
import { withdrawAccessRequest } from "../../../../../../../../access/requests";
export const POST = commandRoute((p, id, input) =>
  withdrawAccessRequest(p, id, input),
);
