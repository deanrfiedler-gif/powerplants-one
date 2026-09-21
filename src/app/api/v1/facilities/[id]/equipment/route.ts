import { facilityEquipment } from "../../../../../../shared/facilities/reads";
import { readRoute } from "../../../../../../shared/http";
export const dynamic = "force-dynamic";
export const GET = readRoute((p, id, q) => facilityEquipment(p, id, q));
