import { readRoute } from "../../../../../shared/http";
import { readOperation } from "../../../../../shared/receipts";
export const dynamic = "force-dynamic";
export const GET = readRoute(async (p, id) => readOperation(p, id));
