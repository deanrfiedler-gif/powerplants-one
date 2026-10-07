import { commandRoute } from "../../../../../../../shared/http";
import { receiveResult } from "../../../../../../../maintenance/receiving";
export const POST = commandRoute((p,id,body)=>receiveResult(p,"due",id,body));
