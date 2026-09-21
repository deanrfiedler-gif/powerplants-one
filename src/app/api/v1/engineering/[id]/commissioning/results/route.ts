import { readView } from "../../../../../../../engineering/commissioning/reads";
import { inspectionCommand } from "../../../../../../../engineering/commissioning/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readView(p, id, q, "results"));
export const POST = commandRoute((p, id, b) => inspectionCommand(p, id, b));
