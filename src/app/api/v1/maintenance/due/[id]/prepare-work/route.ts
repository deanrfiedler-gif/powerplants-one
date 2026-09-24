import { commandRoute } from "../../../../../../../shared/http";
import { prepareWork } from "../../../../../../../maintenance/receiving";
export const POST = commandRoute((p,id,body)=>prepareWork(p,"due",id,body));
