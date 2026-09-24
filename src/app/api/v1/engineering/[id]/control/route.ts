import { controlRead } from "../../../../../../engineering/control/reads";
import { controlCommand } from "../../../../../../engineering/control/commands";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p,id,q) => controlRead(p,id,q));
export const POST = commandRoute((p,id,b) => controlCommand(p,id,b));
