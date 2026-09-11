import { projectHistory } from "../../../../../../projects/service";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => projectHistory(p, id, q));
