import { commandRoute } from "../../../../../../../../shared/http";
import { receiveSupply } from "../../../../../../../../estimating/supply-followup/service";
export const POST = commandRoute(receiveSupply, false);
export const dynamic = "force-dynamic";
