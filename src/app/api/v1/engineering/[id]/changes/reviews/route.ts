import { readView } from "../../../../../../../engineering/changes/reads";
import { reviewCommand } from "../../../../../../../engineering/changes/commands";
import { readRoute, commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readView(p, id, q, "reviews"));
export const POST = commandRoute((p, id, b) => reviewCommand(p, id, b));
