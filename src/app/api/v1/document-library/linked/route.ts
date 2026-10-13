import { linkedDocuments } from "../../../../../library/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => linkedDocuments(p, q));
