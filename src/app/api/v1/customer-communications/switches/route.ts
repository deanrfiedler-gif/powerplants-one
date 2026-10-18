import {
  readMessageClassSwitches,
  setMessageClassSwitch,
} from "../../../../../communications";
import { commandRoute, readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => readMessageClassSwitches(p, q));
export const POST = commandRoute((p, _id, b) => setMessageClassSwitch(p, b));
