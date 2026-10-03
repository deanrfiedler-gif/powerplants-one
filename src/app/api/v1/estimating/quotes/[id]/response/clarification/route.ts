import { commandRoute } from "../../../../../../../../shared/http";
import { recordClarification } from "../../../../../../../../estimating/response/service";
export const POST = commandRoute(recordClarification, false);
export const dynamic = "force-dynamic";
