import { readView } from "../../../../../../../engineering/commissioning/reads";
import { releaseCommand } from "../../../../../../../engineering/commissioning/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readView(p, id, q, "releases"));
export const POST = commandRoute((p, id, b) => releaseCommand(p, id, b));
