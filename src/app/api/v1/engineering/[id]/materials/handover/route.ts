import { readHandovers } from "../../../../../../../engineering/materials/reads";
import { handoverCommand } from "../../../../../../../engineering/materials/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readHandovers(p, id, q));
export const POST = commandRoute((p, id, b) => handoverCommand(p, id, b));
