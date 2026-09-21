import { readView } from "../../../../../../../engineering/changes/reads";
import { handoverCommand } from "../../../../../../../engineering/changes/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readView(p, id, q, "handovers"));
export const POST = commandRoute((p, id, b) => handoverCommand(p, id, b));
