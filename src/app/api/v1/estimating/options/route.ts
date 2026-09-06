import { readRoute } from "../../../../../shared/http";
import { estimatingOptions } from "../../../../../estimating/reads";
export const GET=readRoute(p=>estimatingOptions(p));
export const dynamic="force-dynamic";
