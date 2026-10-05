import { commandRoute } from "../../../../../../../../shared/http";
import { proposeShortfall } from "../../../../../../../../estimating/supply-followup/shortfall-service";
export const POST = commandRoute(proposeShortfall, false);
export const dynamic = "force-dynamic";
