import { readRoute, commandRoute } from "../../../../../shared/http";
import {
  listDiscoveryWorkspaces,
  createDiscoveryWorkspace,
} from "../../../../../estimating/discovery-workspaces";
export const GET = readRoute((p, _id, q) => listDiscoveryWorkspaces(p, q));
export const POST = commandRoute((p, _id, value) =>
  createDiscoveryWorkspace(p, value),
);
export const dynamic = "force-dynamic";
