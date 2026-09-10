import { engineeringOptions } from "../../../../../engineering/service";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => engineeringOptions(p, q));
