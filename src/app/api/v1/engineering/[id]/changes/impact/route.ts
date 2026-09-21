import { readView } from "../../../../../../../engineering/changes/reads";
import { revisionCommand } from "../../../../../../../engineering/changes/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readView(p, id, q, "impact"));
export const POST = commandRoute((p, id, b) => revisionCommand(p, id, b));
