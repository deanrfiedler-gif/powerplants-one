import { readUsePolicy } from "../../../../documents/use/service";
import { readRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, _id, q) => readUsePolicy(p, q));
