import { commandRoute } from "../../../../../../../../shared/http";
import { prepareResponseHandover } from "../../../../../../../../estimating/response/service";
export const POST = commandRoute(prepareResponseHandover, false);
export const dynamic = "force-dynamic";
