import { readRoute } from "../../../../../shared/http";
import { options } from "../../../../../maintenance/reads";
export const GET=readRoute(p=>options(p));
