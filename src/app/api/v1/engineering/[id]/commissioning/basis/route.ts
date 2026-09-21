import { readView } from "../../../../../../../engineering/commissioning/reads";
import { basisCommand } from "../../../../../../../engineering/commissioning/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readView(p, id, q, "basis"));
export const POST = commandRoute((p, id, b) => basisCommand(p, id, b));
