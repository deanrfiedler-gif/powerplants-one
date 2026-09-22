import { readRoute } from "../../../../../../shared/http";
import { creationOptions } from "../../../../../../estimating/fertigation/reads";
export const GET = readRoute((p, _id, q) => creationOptions(p, q));
