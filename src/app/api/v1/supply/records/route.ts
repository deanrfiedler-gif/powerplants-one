import { readRoute, commandRoute } from "../../../../../shared/http";
import { register } from "../../../../../supply/reads";
import { saveRecord } from "../../../../../supply/commands";
export const GET = readRoute((p, _id, q) => register(p, q));
export const POST = commandRoute((p, _id, input) => saveRecord(p, input));
