import { readChanges } from "../../../../../scheduling/workspace-reads";
import { readRoute } from "../../../../../shared/http";
export const GET = readRoute((p,id,q)=>readChanges(p,q));
