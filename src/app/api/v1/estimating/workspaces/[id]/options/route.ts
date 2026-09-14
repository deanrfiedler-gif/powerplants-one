import { commandRoute } from "../../../../../../../shared/http";
import { changeDiscoveryOption } from "../../../../../../../estimating/discovery-workspaces";
export const POST = commandRoute(changeDiscoveryOption, false);
export const dynamic = "force-dynamic";
