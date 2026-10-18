import { readThread } from "../../../../../conversations/reads";
import { readRoute } from "../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => readThread(p, id));
