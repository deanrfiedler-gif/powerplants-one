import { worklistOptions } from "../../../../../crm/worklist";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => worklistOptions(p, q));
