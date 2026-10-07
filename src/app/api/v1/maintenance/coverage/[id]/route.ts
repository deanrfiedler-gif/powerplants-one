import { readRoute } from "../../../../../../shared/http";
import { workspace } from "../../../../../../maintenance/reads";
export const GET = readRoute((p,id)=>workspace(p,"coverage",id));
