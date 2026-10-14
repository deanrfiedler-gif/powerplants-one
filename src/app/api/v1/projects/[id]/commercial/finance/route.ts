import { readRoute } from "../../../../../../../shared/http";
import { readCommercialFinance } from "../../../../../../../projects/commercial/reads";
export const runtime="nodejs";
export const GET=readRoute(readCommercialFinance);
