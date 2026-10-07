import { readRoute, commandRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../maintenance/reads";
import { warrantyCommand } from "../../../../../../maintenance/warranty";
export const GET = readRoute((p,id)=>workspace(p,"cases",id));
export const POST = commandRoute(warrantyCommand,false);
