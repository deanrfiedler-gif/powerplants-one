import { commandRoute } from "../../../../shared/http";
import { captureEntry } from "../../../../field/entries";
export const POST = commandRoute((p,_id,input)=>captureEntry(p,input));
