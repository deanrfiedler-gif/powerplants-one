import { readEntry } from "../../../../../engineering/commissioning/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => readEntry(p, q));
