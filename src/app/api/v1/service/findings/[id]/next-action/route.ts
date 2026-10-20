import { commandRoute, readRoute } from "../../../../../../../shared/http";
import {
  readNextAction,
  setNextAction,
} from "../../../../../../../service/findings/next-action";

export const GET = readRoute((p, id, q) => readNextAction(p, id, q));
export const POST = commandRoute(
  (p, id, input) => setNextAction(p, id!, input),
  false,
);
