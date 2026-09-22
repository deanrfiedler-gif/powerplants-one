import { reviewTarget } from "../../../../../reviews/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => reviewTarget(p, q));
