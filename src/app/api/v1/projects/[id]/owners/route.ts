import { projectOwners } from "../../../../../../projects/service";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => projectOwners(p, id, q));
