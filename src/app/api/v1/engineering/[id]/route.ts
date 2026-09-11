import { readEngineering } from "../../../../../engineering/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readEngineering(p, id, q));
