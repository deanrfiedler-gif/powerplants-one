import { readHistory } from "../../../../../../../engineering/commissioning/reads";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readHistory(p, id, q));
