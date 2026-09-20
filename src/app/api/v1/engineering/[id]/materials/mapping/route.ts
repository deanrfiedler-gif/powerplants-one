import { readMapping } from "../../../../../../../engineering/materials/reads";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readMapping(p, id, q));
