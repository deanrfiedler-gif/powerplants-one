import { commandRoute } from "../../../../../../../../shared/http";
import { issueRelease } from "../../../../../../../../estimating/release/service";
export const POST = commandRoute(issueRelease, false);
export const dynamic = "force-dynamic";
