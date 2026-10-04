import { commandRoute } from "../../../../../../../../shared/http";
import { reviewDisposition } from "../../../../../../../../estimating/disposition/service";
export const POST = commandRoute(reviewDisposition, false);
export const dynamic = "force-dynamic";
