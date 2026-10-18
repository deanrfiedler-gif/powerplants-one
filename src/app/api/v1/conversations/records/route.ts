import { linkableRecords } from "../../../../../conversations/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => linkableRecords(p, q));
