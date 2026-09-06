import { readRoute, commandRoute } from "../../../../../../shared/http";
import { readEstimate } from "../../../../../../estimating/reads";
import { saveEstimate } from "../../../../../../estimating/service";
export const GET=readRoute(readEstimate);
export const POST=commandRoute(saveEstimate,false);
export const dynamic="force-dynamic";
