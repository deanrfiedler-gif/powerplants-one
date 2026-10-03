import { commandRoute } from "../../../../../../../../shared/http";
import { approveRelease } from "../../../../../../../../estimating/release/service";
export const POST = commandRoute(approveRelease, false);
export const dynamic = "force-dynamic";
