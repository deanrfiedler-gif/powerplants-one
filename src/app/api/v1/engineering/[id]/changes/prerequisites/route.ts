import { prerequisiteCommand } from "../../../../../../../engineering/changes/commands";
import { commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
// The in-module synthetic prerequisite: a fictional commercial or scheduling answer, never a Project or Finance approval.
export const POST = commandRoute((p, id, b) => prerequisiteCommand(p, id, b), false);
