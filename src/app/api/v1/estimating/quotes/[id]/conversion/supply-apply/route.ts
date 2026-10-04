import { commandRoute } from "../../../../../../../../shared/http";
import { applySupply } from "../../../../../../../../estimating/supply-followup/service";
export const POST = commandRoute(applySupply, false);
export const dynamic = "force-dynamic";
