import { readRoute, commandRoute } from "../../../../../shared/http";
import { listCases } from "../../../../../service/escalations/reads";
import { createCase } from "../../../../../service/escalations/commands";
export const GET = readRoute((p, _id, q) => listCases(p, q));
export const POST = commandRoute((p, _id, input) => createCase(p, input));
