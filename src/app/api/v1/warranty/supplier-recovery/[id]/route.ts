import { readRoute, commandRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../maintenance/reads";
import { recoveryCommand } from "../../../../../../maintenance/recovery";
export const GET = readRoute((p,id)=>workspace(p,"recovery",id));
export const POST = commandRoute(recoveryCommand,false);
