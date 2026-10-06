import { commandRoute } from "../../../../../../../../shared/http";
import { applyDisposition } from "../../../../../../../../estimating/disposition/service";
export const POST = commandRoute(applyDisposition, false);
export const dynamic = "force-dynamic";
