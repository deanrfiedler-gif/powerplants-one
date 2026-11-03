import { readRoute } from "../../../../../../../shared/http";
import { readCommercialOptions } from "../../../../../../../projects/commercial/reads";
import { readCommercialPicker } from "../../../../../../../projects/commercial/options";
export const runtime="nodejs";
export const GET=readRoute((p,id,q) => q.picker ? readCommercialPicker(p,id,q) : readCommercialOptions(p,id,q));
