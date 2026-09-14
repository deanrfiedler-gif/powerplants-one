import { readRoute } from "../../../../../../../shared/http";
import { object, uuid } from "../../../../../../../shared/validation";
import { readDiscoveryRevision } from "../../../../../../../estimating/discovery-workspaces";
export const GET = readRoute((p, id, q) => {
  const input = object(q, ["revision_id"]);
  return readDiscoveryRevision(p, id, uuid(input.revision_id, "revision_id"));
});
export const dynamic = "force-dynamic";
