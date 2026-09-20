import { readLine } from "../../../../../../../engineering/materials/reads";
import { lineCommand } from "../../../../../../../engineering/materials/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readLine(p, id, q));
export const POST = commandRoute((p, id, b) => lineCommand(p, id, b));
