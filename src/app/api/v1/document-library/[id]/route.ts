import { readDocument } from "../../../../../library/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute(readDocument);
