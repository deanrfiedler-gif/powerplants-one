import { readOutcomeBasis } from "../../../../../../../crm/outcome-sources";
import { readRoute } from "../../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => readOutcomeBasis(p, id!, q));
