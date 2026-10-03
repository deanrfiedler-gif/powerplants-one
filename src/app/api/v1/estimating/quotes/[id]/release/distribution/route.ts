import { commandRoute } from "../../../../../../../../shared/http";
import { recordDistribution } from "../../../../../../../../estimating/release/service";
export const POST = commandRoute(recordDistribution, false);
export const dynamic = "force-dynamic";
