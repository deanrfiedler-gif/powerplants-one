import { commandRoute } from "../../../../../shared/http";
import { initiateAttachment } from "../../../../../field/attachments";
export const POST = commandRoute((p,_id,input)=>initiateAttachment(p,input));
