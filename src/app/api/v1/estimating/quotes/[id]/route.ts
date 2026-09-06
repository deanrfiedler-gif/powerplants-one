import { readRoute } from "../../../../../../shared/http";
import { readQuote } from "../../../../../../estimating/reads";
export const GET=readRoute((p,id)=>readQuote(p,id));
export const dynamic="force-dynamic";
