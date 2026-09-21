import { readRoute } from "../../../../../../shared/http";
import { creationOptions } from "../../../../../../estimating/specialist/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => creationOptions(p, q));
