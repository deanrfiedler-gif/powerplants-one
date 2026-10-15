import { commandRoute } from "../../../../../../../shared/http";
import { decidePackage } from "../../../../../../../cpq/packages";
export const POST = commandRoute((p, id, v) =>
  decidePackage(p, id, "Publish", v),
);
