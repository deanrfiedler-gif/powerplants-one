import { readWorkspace } from "../../../../../projects/acceptance/reads";
import { command } from "../../../../../projects/acceptance/commands";
import { readRoute, commandRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => readWorkspace(p, q));
export const POST = commandRoute((p, _id, v) => command(p, v));
