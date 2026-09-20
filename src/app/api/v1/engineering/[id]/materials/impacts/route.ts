import { impactCommand } from "../../../../../../../engineering/materials/commands";
import { commandRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute((p, id, b) => impactCommand(p, id, b));
