import { commandRoute } from "../../../../../../../../shared/http";
import { reviewConversionPlan } from "../../../../../../../../estimating/conversion/service";
export const POST = commandRoute(reviewConversionPlan, false);
export const dynamic = "force-dynamic";
