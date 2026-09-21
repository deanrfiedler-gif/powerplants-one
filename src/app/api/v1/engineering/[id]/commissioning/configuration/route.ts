import { readView } from "../../../../../../../engineering/commissioning/reads";
import { configurationCommand } from "../../../../../../../engineering/commissioning/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readView(p, id, q, "configuration"));
export const POST = commandRoute((p, id, b) => configurationCommand(p, id, b));
