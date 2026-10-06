import { readRoute, commandRoute } from "../../../../../../shared/http";
import { readProductUses } from "../../../../../../products/uses";
export const GET = readRoute((p, id, _q) => readProductUses(p, id));
import { linkProductUse } from "../../../../../../products/uses";
export const POST = commandRoute((p, id, b) => linkProductUse(p, id, b), false);
export const dynamic = "force-dynamic";
