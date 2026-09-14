import { readRoute, commandRoute } from "../../../../../../shared/http";
import { object } from "../../../../../../shared/validation";
import {
  readDiscoveryWorkspace,
  changeDiscoveryWorkspace,
} from "../../../../../../estimating/discovery-workspaces";
export const GET = readRoute((p, id, q) => {
  object(q, []);
  return readDiscoveryWorkspace(p, id);
});
export const POST = commandRoute(changeDiscoveryWorkspace, false);
export const dynamic = "force-dynamic";
