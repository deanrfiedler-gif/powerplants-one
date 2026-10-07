import { readRoute, commandRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../maintenance/reads";
import { renewalCommand } from "../../../../../../maintenance/renewals";
export const GET = readRoute((p,id)=>workspace(p,"renewals",id));
export const POST = commandRoute(renewalCommand,false);
