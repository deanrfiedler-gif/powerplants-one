import { object } from "../../../../../shared/validation";
import { readRoute } from "../../../../../shared/http";
import { attachmentMetadata } from "../../../../../field/attachments";
export const GET = readRoute((p,id,q)=>{object(q,[]);return attachmentMetadata(p,id);});
