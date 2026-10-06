import { commandRoute } from "../../../../../../../../shared/http";
import { referSupply } from "../../../../../../../../estimating/supply-followup/service";
export const POST = commandRoute(referSupply, false);
export const dynamic = "force-dynamic";
