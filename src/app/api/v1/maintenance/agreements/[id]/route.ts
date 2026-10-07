import { readRoute, commandRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../maintenance/reads";
import { agreementCommand } from "../../../../../../maintenance/agreements";
export const GET = readRoute((p,id)=>workspace(p,"agreements",id));
export const POST = commandRoute(agreementCommand,false);
