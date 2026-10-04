import { commandRoute } from "../../../../../../../../shared/http";
import { reviewSupply } from "../../../../../../../../estimating/supply-followup/service";
export const POST = commandRoute(reviewSupply, false);
export const dynamic = "force-dynamic";
