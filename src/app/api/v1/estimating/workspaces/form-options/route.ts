import { readRoute } from "../../../../../../shared/http";
import { discoveryFormOptions } from "../../../../../../estimating/discovery-form-options";
export const GET = readRoute((p, _id, q) => discoveryFormOptions(p, q));
export const dynamic = "force-dynamic";
