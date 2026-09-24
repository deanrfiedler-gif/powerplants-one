import { readRoute, commandRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../maintenance/reads";
import { occurrenceCommand } from "../../../../../../maintenance/plans";
export const GET = readRoute((p,id)=>workspace(p,"due",id));
export const POST = commandRoute(occurrenceCommand,false);
