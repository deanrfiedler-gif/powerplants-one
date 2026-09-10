import { projectOptions } from "../../../../../projects/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => projectOptions(p, q));
