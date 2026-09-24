import { readRoute } from "../../../../../../shared/http";
import { bulletinWorkspace } from "../../../../../../equipment/evidence";
export const GET = readRoute((p, id) => bulletinWorkspace(p, id));
