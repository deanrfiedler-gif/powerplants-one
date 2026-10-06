import { readRoute } from "../../../../../shared/http";
import { options } from "../../../../../supply/reads";
export const GET = readRoute((p) => options(p));
