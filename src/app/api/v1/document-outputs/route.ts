import { readRoute } from "../../../../shared/http";
import { listOutputs } from "../../../../outputs/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => listOutputs(p, q));
