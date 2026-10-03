import { commandRoute } from "../../../../../../../../shared/http";
import { recordResponse } from "../../../../../../../../estimating/response/service";
export const POST = commandRoute(recordResponse, false);
export const dynamic = "force-dynamic";
