import { readRoute } from "../../../../../../shared/http";
import { existingCreationWorkspace } from "../../../../../../estimating/discovery-creation-reads";
export const GET = readRoute((p, _id, q) => existingCreationWorkspace(p, q));
export const dynamic = "force-dynamic";
