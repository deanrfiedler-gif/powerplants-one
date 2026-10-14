import { assignUse } from "../../../../documents/use/service";
import { commandRoute } from "../../../../shared/http";
export const dynamic = "force-dynamic";
export const POST = commandRoute((p, _id, b) => assignUse(p, b));
