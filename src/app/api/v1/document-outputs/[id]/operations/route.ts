import { readRoute } from "../../../../../../shared/http";
import { recoverOutputOperation } from "../../../../../../outputs/actions";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => recoverOutputOperation(p, id, q));
