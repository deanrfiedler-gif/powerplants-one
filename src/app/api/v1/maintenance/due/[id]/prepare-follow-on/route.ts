import { commandRoute } from "../../../../../../../shared/http";
import { prepareFollowOn } from "../../../../../../../maintenance/receiving";
export const POST = commandRoute((p,id,body)=>prepareFollowOn(p,id,body));
