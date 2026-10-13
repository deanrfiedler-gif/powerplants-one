import { readRoute } from "../../../../../shared/http";
import { readOutput } from "../../../../../outputs/reads";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readOutput(p, id, q));
