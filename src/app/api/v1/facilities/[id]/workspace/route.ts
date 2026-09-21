import { facilityWorkspace } from "../../../../../../shared/facilities/reads";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id) => facilityWorkspace(p, id));
