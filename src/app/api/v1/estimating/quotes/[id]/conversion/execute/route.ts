import { commandRoute } from "../../../../../../../../shared/http";
import { executeConversion } from "../../../../../../../../estimating/conversion/service";
export const POST = commandRoute(executeConversion, false);
export const dynamic = "force-dynamic";
