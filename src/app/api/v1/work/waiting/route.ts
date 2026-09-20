import { readWorkWaiting } from "../../../../../activities/work-overview";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => readWorkWaiting(p, q));
