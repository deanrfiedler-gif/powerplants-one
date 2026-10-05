import { commandRoute } from "../../../../../../shared/http";
import { reduceAllocations } from "../../../../../../supply/commands";
export const POST = commandRoute((principal, _id, input) =>
  reduceAllocations(principal, input),
);
