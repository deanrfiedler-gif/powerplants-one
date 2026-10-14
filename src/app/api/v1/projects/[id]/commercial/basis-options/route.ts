import { readRoute } from "../../../../../../../shared/http";
import { readCommercialOptions } from "../../../../../../../projects/commercial/reads";
export const runtime="nodejs";
export const GET=readRoute(readCommercialOptions);
