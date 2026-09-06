import { readOpportunity } from "../../../../../../crm/reads";
import { readRoute } from "../../../../../../shared/http";
import { envelope } from "../../../../../../shared/reads";
export const dynamic="force-dynamic";
export const GET=readRoute(async(p,id)=>envelope([await readOpportunity(p,id)]));
