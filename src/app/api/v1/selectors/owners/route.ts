import { ownerOptions } from "../../../../../shared/context";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => ownerOptions(p, q));
