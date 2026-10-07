import { readRoute, commandRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../maintenance/reads";
import { planCommand } from "../../../../../../maintenance/plans";
export const GET = readRoute((p,id)=>workspace(p,"plans",id));
export const POST = commandRoute(planCommand,false);
