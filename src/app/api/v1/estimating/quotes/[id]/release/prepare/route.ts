import { commandRoute } from "../../../../../../../../shared/http";
import { prepareRelease } from "../../../../../../../../estimating/release/service";
export const POST = commandRoute(prepareRelease, false);
export const dynamic = "force-dynamic";
