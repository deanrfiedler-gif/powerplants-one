import { readRegister } from "../../../../../../engineering/changes/reads";
import { changeCommand } from "../../../../../../engineering/changes/commands";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readRegister(p, id, q));
export const POST = commandRoute((p, id, b) => changeCommand(p, id, b));
