import { readRegister } from "../../../../../../engineering/commissioning/reads";
import { packageCommand } from "../../../../../../engineering/commissioning/commands";
import { readRoute, commandRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readRegister(p, id, q));
export const POST = commandRoute((p, id, b) => packageCommand(p, id, b));
