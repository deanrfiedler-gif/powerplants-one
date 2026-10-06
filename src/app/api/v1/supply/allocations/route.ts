import { commandRoute } from "../../../../../shared/http";
import { allocate } from "../../../../../supply/commands";
export const POST = commandRoute((p, _id, input) => allocate(p, input));
